import { exec } from "child_process";
import { NextResponse } from "next/server";

export async function POST() {
  return new Promise((resolve) => {
    // Check if container is running
    exec("docker ps -q -f name=kali_vm_new", (checkError, checkStdout) => {
      if (checkStdout.trim()) {
        // Container is running; return success immediately
        resolve(NextResponse.json({ success: true, containerId: checkStdout.trim() }, { status: 200 }));
      } else {
        // Container not found; create it
        const command =
          "docker run -d --name=kali_vm_new --network=bridge kalilinux/kali-rolling tail -f /dev/null";
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error("Error starting Kali container:", stderr);
            resolve(NextResponse.json({ success: false, error: stderr }, { status: 500 }));
          } else {
            resolve(NextResponse.json({ success: true, containerId: stdout.trim() }, { status: 200 }));
          }
        });
      }
    });
  });
}
