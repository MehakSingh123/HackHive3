//app/api/websocket.js  
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';

const containerName = 'kali-default';
const restrictedPatterns = [
  /\brm\s+-rf\b/,
  /\bshutdown\b/, /\breboot\b/, /\binit\b/,
  />/, />>/, /\bchmod\s+777\b/, /\bdd\b/,
  /\bnohup\b/, /&\s*$/,
];

if (!global.wssInstance) {
  console.log('Creating new WebSocket Server...');
  const wss = new WebSocketServer({ noServer: true });
  global.wssInstance = wss;
  global.wsClients = new Map();

  wss.on('connection', (ws, req) => {
    console.log('Client connected');
    const clientIp = req.socket.remoteAddress || req.headers['x-forwarded-for'];
    ws.ip = clientIp;

    // Initial prompt
    ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));

    ws.on('message', (message) => {
      const command = message.toString().trim();
      if (!command) {
        ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));
        return;
      }

      // Security check
      if (restrictedPatterns.some(pattern => pattern.test(command))) {
        console.warn(`Restricted command attempt: ${command}`);
        ws.send(JSON.stringify({ type: 'error', content: 'Command restricted' }));
        ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));
        return;
      }

      // Check existing processes
      if (global.wsClients.has(ws)) {
        ws.send(JSON.stringify({ type: 'error', content: 'Another command is running' }));
        return;
      }

      // Execute command
      try {
        const child = spawn('docker', [
          'exec', '-it', containerName,
          'sh', '-c', `script -q /dev/null -c "${command.replace(/"/g, '\\"')}"`
        ]);

        global.wsClients.set(ws, child);
        console.log(`Executing: ${command}`);

        // Send command echo
        ws.send(JSON.stringify({ type: 'command', content: command }));

        // Handle output
        const sendOutput = (data, type) => {
          const lines = data.toString().split('\n');
          lines.forEach(line => {
            if (line.trim()) ws.send(JSON.stringify({ type, content: line }));
          });
        };

        child.stdout.on('data', data => sendOutput(data, 'output'));
        child.stderr.on('data', data => sendOutput(data, 'error'));

        child.on('close', (code) => {
          global.wsClients.delete(ws);
          ws.send(JSON.stringify({ 
            type: 'system', 
            content: `Process exited with code ${code}` 
          }));
          ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));
        });

        child.on('error', (err) => {
          console.error('Execution error:', err);
          global.wsClients.delete(ws);
          ws.send(JSON.stringify({ type: 'error', content: err.message }));
          ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));
        });

      } catch (error) {
        console.error('Spawn error:', error);
        ws.send(JSON.stringify({ type: 'error', content: 'Failed to start command' }));
        ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));
      }
    });

    ws.on('close', () => {
      const child = global.wsClients.get(ws);
      if (child) {
        child.kill('SIGTERM');
        global.wsClients.delete(ws);
      }
    });
  });
}

export default function handler(req, res) {
  if (!req.headers.upgrade?.toLowerCase() === 'websocket') {
    return res.status(405).send('WebSocket required');
  }

  if (!global.wssInstance) {
    return res.status(503).send('Service unavailable');
  }

  global.wssInstance.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
    global.wssInstance.emit('connection', ws, req);
  });
}

export const config = {
  api: { bodyParser: false, externalResolver: true }
};