// app/api/vm/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

// Hardcoded container name for reusability
const containerName = "kali-default";
const execPromise = promisify(exec);

// Helper function to execute commands and handle errors
async function executeCommand(command) {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr && !stderr.includes("Warning")) {
      console.error(`Command error: ${stderr}`);
      throw new Error(stderr);
    }
    return { stdout: stdout.trim(), stderr };
  } catch (error) {
    console.error(`Command execution failed: ${error.message}`);
    throw error;
  }
}

async function containerExists() {
  try {
    const { stdout } = await executeCommand(`docker ps -a -q -f name=^/${containerName}$`);
    return !!stdout;
  } catch (error) {
    console.error("Error checking container existence:", error);
    return false;
  }
}

async function isContainerRunning() {
  try {
    const { stdout } = await executeCommand(`docker ps -q -f name=^/${containerName}$`);
    return !!stdout;
  } catch (error) {
    console.error("Error checking if container is running:", error);
    return false;
  }
}

async function startVM() {
  try {
    const exists = await containerExists();
    const isRunning = await isContainerRunning();

    if (exists) {
      if (isRunning) {
        console.log("Container is already running");
        return {
          success: true,
          containerId: containerName,
          message: "VM is already running.",
        };
      } else {
        console.log("Starting existing container");
        await executeCommand(`docker start ${containerName}`);
        return {
          success: true,
          containerId: containerName,
          message: "VM started successfully.",
        };
      }
    } else {
      console.log("Creating new container");
      const { stdout } = await executeCommand(
        `docker run -d --name=${containerName} --network=bridge kalilinux/kali-rolling tail -f /dev/null`
      );
      return {
        success: true,
        containerId: stdout,
        message: "VM created and started successfully.",
      };
    }
  } catch (error) {
    console.error("Error in startVM:", error);
    throw error;
  }
}

async function stopVM() {
  const isRunning = await isContainerRunning();
  if (!isRunning) {
    return { success: true, message: "VM is already stopped." };
  }
  
  await executeCommand(`docker stop ${containerName}`);
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

// Handle OPTIONS requests (for CORS support)
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