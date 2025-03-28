//app/api/execute/page.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import containerName from "../../lib/containerName";

const execPromise = promisify(exec);

// Securely restrict dangerous commands
const restrictedPatterns = [
  /\brm\s+-rf\b/, // Prevents variations like "rm  -rf" (extra spaces)
  /\bshutdown\b/,
  /\breboot\b/,
  /\binit\b/, // System control
  />/,
  />>/, // File overwriting
  /\bchmod\s+777\b/, // Dangerous permission changes
  /\bdd\b/, // Low-level disk operations
];

export async function POST(request) {
  try {
    const body = await request.json();
    const { command } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Invalid command" }, { status: 400 });
    }

    // Check for restricted commands using regex
    if (restrictedPatterns.some((pattern) => pattern.test(command))) {
      return NextResponse.json(
        { error: "This command is restricted for security reasons" },
        { status: 403 }
      );
    }

    // Verify if the VM container is running
    const checkContainer = await execPromise(
      `docker ps -q -f name=${containerName}`
    );
    if (!checkContainer.stdout.trim()) {
      return NextResponse.json(
        { error: "VM is not running. Start the VM first." },
        { status: 400 }
      );
    }

    // Execute the command inside the container using the Kali image's container
    const dockerCommand = `docker exec ${containerName} ${command}`;

    try {
      const { stdout, stderr } = await execPromise(dockerCommand);
      return NextResponse.json({
        output: stdout || stderr || "Command executed successfully",
      });
    } catch (execError) {
      console.error("Command execution error:", execError);
      return NextResponse.json(
        {
          error: execError.message || "Error executing command",
          output: execError.stderr || "",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle CORS for OPTIONS requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
