// server.js
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const next = require('next');

const containerName = 'kali-default';
const restrictedPatterns = [
  /\brm\s+-rf\b/, /\bshutdown\b/, /\breboot\b/, /\binit\b/,
  />/, />>/, /\bchmod\s+777\b/, /\bdd\b/, /\bnohup\b/, /&\s*$/
];

// Initialize Next.js
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handler = nextApp.getRequestHandler();

// WebSocket Server
const wss = new WebSocketServer({ port: 3001 });
const activeProcesses = new Map();
const userSessions = new Map();

function validateCommand(command) {
  return !restrictedPatterns.some(pattern => pattern.test(command));
}

async function checkContainer() {
  return new Promise((resolve) => {
    const check = spawn('docker', ['ps', '-q', '-f', `name=${containerName}`]);
    let output = '';
    
    check.stdout.on('data', (data) => output += data.toString());
    check.on('close', () => resolve(output.trim().length > 0));
  });
}

function updatePrompt(ws) {
  const session = userSessions.get(ws);
  const prompt = session?.cwd === '/root' ? '~' : session?.cwd || '~';
  ws.send(JSON.stringify({ type: 'prompt', content: `root@vm:${prompt}# ` }));
}

wss.on('connection', (ws, req) => {
  console.log('New client connected');
  userSessions.set(ws, { cwd: '/root', env: {} });

  ws.send(JSON.stringify({ type: 'system', content: 'Terminal initialized' }));
  updatePrompt(ws);

  ws.on('message', async (command) => {
    const cmd = command.toString().trim();
    if (!cmd) return updatePrompt(ws);

    // Security validation
    if (!validateCommand(cmd)) {
      ws.send(JSON.stringify({ type: 'error', content: 'Command restricted' }));
      return updatePrompt(ws);
    }

    // Check for existing process
    if (activeProcesses.has(ws)) {
      ws.send(JSON.stringify({ type: 'error', content: 'Command already in progress' }));
      return;
    }

    // Verify container status
    const containerRunning = await checkContainer();
    if (!containerRunning) {
      ws.send(JSON.stringify({ type: 'error', content: 'Container not available' }));
      return updatePrompt(ws);
    }

    // Handle CD command separately
    if (cmd.startsWith('cd ')) {
      handleDirectoryChange(ws, cmd);
      return;
    }

    executeCommand(ws, cmd);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    const proc = activeProcesses.get(ws);
    if (proc) proc.kill();
    activeProcesses.delete(ws);
    userSessions.delete(ws);
  });
});

async function handleDirectoryChange(ws, command) {
  const session = userSessions.get(ws);
  const targetDir = command.slice(3).trim();

  try {
    const result = await new Promise((resolve) => {
      const child = spawn('docker', [
        'exec', containerName,
        'bash', '-c', `cd "${session.cwd}" && cd "${targetDir}" && pwd`
      ]);

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => output += data.toString());
      child.stderr.on('data', (data) => error += data.toString());

      child.on('close', (code) => {
        resolve(code === 0 ? output.trim() : error.trim());
      });
    });

    if (result.startsWith('/')) {
      session.cwd = result;
      ws.send(JSON.stringify({ type: 'output', content: result }));
    } else {
      ws.send(JSON.stringify({ type: 'error', content: result }));
    }
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', content: 'Directory change failed' }));
  }

  updatePrompt(ws);
}

function executeCommand(ws, command) {
  const session = userSessions.get(ws);
  const child = spawn('docker', [
    'exec', '-w', session.cwd, containerName,
    'bash', '-c', command
  ]);

  activeProcesses.set(ws, child);

  // Send command echo
  ws.send(JSON.stringify({ type: 'command', content: command }));

  // Handle output
  child.stdout.on('data', (data) => {
    data.toString().split('\n').forEach(line => {
      if (line.trim()) ws.send(JSON.stringify({ type: 'output', content: line }));
    });
  });

  child.stderr.on('data', (data) => {
    data.toString().split('\n').forEach(line => {
      if (line.trim()) ws.send(JSON.stringify({ type: 'error', content: line }));
    });
  });

  // Cleanup on exit
  child.on('close', (code) => {
    activeProcesses.delete(ws);
    if (code !== 0) {
      ws.send(JSON.stringify({ type: 'system', content: `Exit code: ${code}` }));
    }
    updatePrompt(ws);
  });

  child.on('error', (err) => {
    ws.send(JSON.stringify({ type: 'error', content: err.message }));
    activeProcesses.delete(ws);
    updatePrompt(ws);
  });
}

// Start Next.js server
nextApp.prepare().then(() => {
  require('http').createServer(handler).listen(3000, () => {
    console.log('Next.js: http://localhost:3000');
    console.log('WebSocket: ws://localhost:3001');
  });
});