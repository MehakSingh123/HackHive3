// /api/execute-command/route.js
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec to use with async/await
const execPromise = promisify(exec);

// Define a list of restricted commands for safety
const restrictedCommands = [
  'rm -rf', // Dangerous delete commands
  'shutdown', 'reboot', 'init', // System control commands
  '>', '>>', // File redirection that could overwrite system files
  'chmod 777', // Dangerous permission changes
  'dd', // Low-level operations that could corrupt drives
];

export async function POST(request) {
  try {
    // Parse the request body to get the command
    const body = await request.json();
    const { command } = body;

    // Safety check: If command is empty
    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
    }

    // Safety check: Check for restricted commands
    if (restrictedCommands.some(restricted => command.includes(restricted))) {
      return NextResponse.json({ 
        error: 'This command is restricted for security reasons' 
      }, { status: 403 });
    }

    // Execute the command in the Kali container
    // Replace this with your actual method of communicating with the Kali container
    // Example: Using Docker exec
    const dockerCommand = `docker exec kali_vm_new ${command}`;

    try {
      const { stdout, stderr } = await execPromise(dockerCommand);
      
      // Return the command output
      return NextResponse.json({ 
        output: stdout || stderr || 'Command executed successfully' 
      });
    } catch (execError) {
      console.error('Command execution error:', execError);
      
      // Return error from command execution
      return NextResponse.json({ 
        error: execError.message || 'Error executing command',
        output: execError.stderr || '' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// For handling OPTIONS requests (CORS support)
export async function OPTIONS() {
  return NextResponse.json({}, { 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}