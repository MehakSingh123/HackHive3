// app/api/perform-nmap/route.js
import { exec } from "child_process";
import { NextResponse } from "next/server";

export async function POST(request) {
  const { target } = await request.json();
  
  if (!target) {
    return NextResponse.json({ error: "Target IP is required." }, { status: 400 });
  }
  
  return new Promise((resolve) => {
    const command = `docker exec kali_vm_new nmap ${target}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error executing nmap:", stderr);
        resolve(NextResponse.json({ error: stderr }, { status: 500 }));
      } else {
        const aiSummary = `AI Summary of Nmap Results:\n${stdout}`;
        resolve(NextResponse.json({ result: aiSummary }, { status: 200 }));
      }
    });
  });
}
