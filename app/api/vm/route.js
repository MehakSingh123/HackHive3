// app/api/vm/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import containerName from "../../lib/containerName";

const execPromise = promisify(exec);

async function startVM() {
  // Check if container is already running
  // Start the container
  const command = `docker run -d --name=${containerName} --network=bridge kalilinux/kali-rolling tail -f /dev/null`;
  const { stdout, stderr } = await execPromise(command);
  if (stderr) {
    throw new Error(stderr);
  }
  return {
    success: true,
    containerId: stdout.trim(),
    message: "VM started successfully.",
  };
}

async function stopVM() {
  // Check if container is running
  // Stop the container
  const command = `docker stop ${containerName}`;
  const { stdout, stderr } = await execPromise(command);
  if (stderr) {
    throw new Error(stderr);
  }
  // Optionally, remove the container afterwards:
  await execPromise(`docker rm ${containerName}`);
  return { success: true, message: "VM stopped successfully." };
}

export async function POST(request) {
  try {
    const result = await startVM();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error starting VM:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const result = await stopVM();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error stopping VM:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Optional: Handle OPTIONS requests (for CORS support)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
