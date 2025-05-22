// server.js (with enhanced logging and full Docker interaction)

const http = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const Docker = require('dockerode');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js App
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize Docker client
console.log('[Server] Initializing Docker client...');
const docker = new Docker(); // Assumes Docker socket is available locally

// --- Container Configuration ---
const CONTAINER_NAME = 'vm-container';
// IMPORTANT: Update this to the actual image name you want to use
const IMAGE_NAME = 'vm-full'; // Replace 'vm-full' with your actual image
console.log(`[Server] Config - Container Name: ${CONTAINER_NAME}, Image Name: ${IMAGE_NAME}`);

// --- Helper function to find container ---
async function findContainer(name) {
    // console.log(`[Docker] Attempting to find container by name: ${name}`); // Noisy
    try {
        const containers = await docker.listContainers({ all: true, filters: { name: [`^/${name}$`] } });
        if (containers.length > 0) {
            // console.log(`[Docker] Found container ${name} with ID: ${containers[0].Id}`);
            return docker.getContainer(containers[0].Id);
        }
        // console.log(`[Docker] Container ${name} not found.`);
        return null;
    } catch (error) {
        console.error(`[Docker] Error finding container ${name}:`, error.statusCode, error.message || error.reason || error);
        if (error.statusCode === 404) return null;
        throw error;
    }
}

// --- Helper function to send JSON responses ---
function sendJsonResponse(res, statusCode, data) {
    const jsonResponse = JSON.stringify(data);
    // Log truncated response to avoid flooding console
    console.log(`[API:Response] Sending ${statusCode}: ${jsonResponse.substring(0, 200)}${jsonResponse.length > 200 ? '...' : ''}`);
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(jsonResponse);
}

// --- Helper function to read request body (for POST) ---
async function getRequestBody(req) {
    // Basic implementation
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch (e) {
                 console.error('[API:Request] Invalid JSON in request body:', e.message);
                 reject(new Error("Invalid JSON in request body"));
            }
        });
        req.on('error', err => {
             console.error('[API:Request] Error reading request body:', err);
             reject(err); });
    });
}

app.prepare().then(() => {
    console.log('[Server] Next.js app prepared.');
    const server = http.createServer(async (req, res) => {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;
        // console.log(`[HTTP] Request received: ${req.method} ${req.url}`); // Can be very noisy

        try {
            // --- API Route Handling (VM Control) ---
            if (pathname === '/api/vm/start' && req.method === 'POST') {
                console.log('[API:Start] Received request.');
                try {
                    let container = await findContainer(CONTAINER_NAME);
                    if (container) {
                        const info = await container.inspect();
                        if (!info.State.Running) {
                            console.log(`[API:Start] Starting existing container ${CONTAINER_NAME}...`);
                            await container.start();
                            sendJsonResponse(res, 200, { status: 'started', message: `Container ${CONTAINER_NAME} started.` });
                        } else {
                            console.log(`[API:Start] Container ${CONTAINER_NAME} is already running.`);
                            sendJsonResponse(res, 200, { status: 'already_running', message: `Container ${CONTAINER_NAME} is already running.` });
                        }
                    } else {
                        console.log(`[API:Start] Creating and starting container ${CONTAINER_NAME} from image ${IMAGE_NAME}...`);
                        const createOptions = {
                            Image: IMAGE_NAME, name: CONTAINER_NAME, Tty: false,
                            AttachStdin: false, AttachStdout: false, AttachStderr: false, OpenStdin: false,
                            // Cmd: ["tail", "-f", "/dev/null"], // Ensure container stays running if needed
                            HostConfig: { RestartPolicy: { Name: 'no' }, Privileged: true /* Add PortBindings, Binds etc. */ },
                        };
                        console.log('[API:Start] Create options:', JSON.stringify(createOptions));
                        container = await docker.createContainer(createOptions);
                        console.log(`[API:Start] Container created with ID: ${container.id}. Starting...`);
                        await container.start();
                        sendJsonResponse(res, 200, { status: 'created_started', message: `Container ${CONTAINER_NAME} created and started.` });
                    }
                } catch (error) {
                    console.error('[API:Start] Error:', error.statusCode, error.message || error.reason || error);
                    sendJsonResponse(res, error.statusCode || 500, { error: 'Failed to start container', details: error.message || error.reason || error.toString() });
                }
                return; // Handled

            } else if (pathname === '/api/vm/stop' && req.method === 'POST') {
                console.log('[API:Stop] Received request.');
                try {
                    const container = await findContainer(CONTAINER_NAME);
                    if (container) {
                        const info = await container.inspect();
                        if (info.State.Running) {
                            console.log(`[API:Stop] Stopping container ${CONTAINER_NAME}...`);
                            await container.stop({ t: 5 }); // 5 second timeout before kill
                            console.log(`[API:Stop] Container ${CONTAINER_NAME} stopped.`);
                            sendJsonResponse(res, 200, { status: 'stopped', message: `Container ${CONTAINER_NAME} stopped.` });
                        } else {
                            console.log(`[API:Stop] Container ${CONTAINER_NAME} is already stopped.`);
                            sendJsonResponse(res, 200, { status: 'already_stopped', message: `Container ${CONTAINER_NAME} is already stopped.` });
                        }
                    } else {
                         console.log(`[API:Stop] Container ${CONTAINER_NAME} not found.`);
                        sendJsonResponse(res, 404, { status: 'not_found', message: `Container ${CONTAINER_NAME} not found.` });
                    }
                } catch (error) {
                    console.error('[API:Stop] Error:', error.statusCode, error.message || error.reason || error);
                    sendJsonResponse(res, error.statusCode || 500, { error: 'Failed to stop container', details: error.message || error.reason || error.toString() });
                }
                return; // Handled

            } else if (pathname === '/api/vm/status' && req.method === 'GET') {
                // console.log('[API:Status] Received request.');
                try {
                    const container = await findContainer(CONTAINER_NAME);
                    if (container) {
                        const info = await container.inspect();
                        const responseData = {
                            status: info.State.Status, running: info.State.Running,
                            containerId: info.Id, name: info.Name.substring(1),
                        };
                        sendJsonResponse(res, 200, responseData);
                    } else {
                        sendJsonResponse(res, 200, { status: 'not_found', running: false });
                    }
                } catch (error) {
                    if (error.statusCode === 404) {
                         // console.log('[API:Status] Container not found during status check.');
                         sendJsonResponse(res, 200, { status: 'not_found', running: false });
                    } else {
                        console.error('[API:Status] Error:', error.statusCode, error.message || error.reason || error);
                        sendJsonResponse(res, error.statusCode || 500, { error: 'Failed to get container status', details: error.message || error.reason || error.toString() });
                    }
                }
                return; // Handled
            }

            // --- Default behavior: Let Next.js handle the request ---
            await handle(req, res, parsedUrl);

        } catch (err) {
            console.error('[HTTP] Unhandled error during request processing:', err);
            if (!res.writableEnded) {
                res.statusCode = 500;
                res.end('Internal Server Error');
            }
        }
    });

    // --- WebSocket Server Setup ---
    console.log('[WebSocket] Initializing WebSocketServer...');
    const wss = new WebSocketServer({ noServer: true }); // Handle upgrade manually

    // --- Handle HTTP Upgrade Requests for WebSocket ---
    server.on('upgrade', (request, socket, head) => {
        const parsedUrl = parse(request.url, true);
        console.log(`[WebSocket] Upgrade requested for path: ${parsedUrl.pathname}`);
        // Only handle upgrades for the specific terminal path
        if (parsedUrl.pathname === '/api/terminal') {
             console.log('[WebSocket] Handling upgrade for /api/terminal...');
            wss.handleUpgrade(request, socket, head, (ws) => {
                console.log('[WebSocket] Upgrade successful, emitting connection event.');
                wss.emit('connection', ws, request); // Forward to connection handler
            });
        } else {
            console.log(`[WebSocket] Destroying socket for unhandled path: ${parsedUrl.pathname}`);
            socket.destroy();
        }
    });

    // --- WebSocket Connection Logic for Terminal ---
    wss.on('connection', (ws, req) => {
        const connectionId = Math.random().toString(36).substring(2, 8); // Simple ID for logging
        console.log(`[WebSocket:Connect][${connectionId}] Client connected.`);

        const parsedUrl = parse(req.url, true);
        const terminalContainerId = parsedUrl.query.containerId || CONTAINER_NAME;

        console.log(`[WebSocket:Connect][${connectionId}] Attempting terminal connection to container ID: ${terminalContainerId}`);

        if (!terminalContainerId) {
            console.error(`[WebSocket:Connect][${connectionId}] Error: Missing containerId.`);
            ws.close(1008, "Missing containerId");
            return;
        }

        // Command to run inside the container
        const cmd = ['/bin/bash']; // Use bash by default
        // const cmd = ['/bin/sh']; // Alternative if bash isn't present
        // const cmd = ['sleep', '300']; // Diagnostic: Keep connection open without shell
        console.log(`[WebSocket:Connect][${connectionId}] Using command: ${cmd.join(' ')}`);

        const execOptions = {
            Cmd: cmd,
            AttachStdin: true, AttachStdout: true, AttachStderr: true,
            Tty: true, // Essential for interactive shells
        };

        let execInstance;
        let streamInstance;

        // Cleanup Function specific to this connection
        let cleanedUp = false;
        const cleanup = (source) => {
            if (cleanedUp) return;
            cleanedUp = true;
            console.log(`[Cleanup][${connectionId}] Cleaning up connection (triggered by ${source})...`);
            streamInstance?.removeAllListeners();
            ws?.removeAllListeners();

            if (streamInstance && typeof streamInstance.destroy === 'function' && !streamInstance.destroyed) {
                console.log(`[Cleanup][${connectionId}] Destroying Docker stream.`);
                streamInstance.destroy();
            } else { console.log(`[Cleanup][${connectionId}] Docker stream already destroyed/unavailable.`); }

            if (ws && (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING)) {
                console.log(`[Cleanup][${connectionId}] Closing WebSocket.`);
                ws.close(1000, "Session terminated");
            } else { console.log(`[Cleanup][${connectionId}] WebSocket already closed/closing.`); }
            console.log(`[Cleanup][${connectionId}] Cleanup finished.`);
        };


        console.log(`[WebSocket:Connect][${connectionId}] Getting container object for ${terminalContainerId}...`);
        let container;
        try {
             container = docker.getContainer(terminalContainerId);
             // Optional: Ping container to ensure it's accessible before exec
             // await container.inspect(); // This implicitly checks existence
        } catch(getContainerError) {
             console.error(`[WebSocket:Connect][${connectionId}] Error getting container ${terminalContainerId}:`, getContainerError);
             ws.close(1011, "Server error: Cannot get container");
             return;
        }

        console.log(`[WebSocket:Connect][${connectionId}] Creating exec instance in ${terminalContainerId}...`);
        container.exec(execOptions, (err, exec) => {
             if (err || !exec) {
                 console.error(`[WebSocket:Connect][${connectionId}] Docker exec creation failed:`, err);
                 ws.close(1011, `Server error: ${err?.message || 'Failed to create exec instance'}`);
                 return;
             }
             console.log(`[WebSocket:Connect][${connectionId}] Exec instance created. Starting stream...`);
             execInstance = exec;

             exec.start({ hijack: true, stdin: true }, (err, stream) => {
                 if (err || !stream) {
                    console.error(`[WebSocket:Connect][${connectionId}] Docker exec stream start failed:`, err);
                    ws.close(1011, `Server error: ${err?.message || 'Failed to start stream'}`);
                    return;
                 }
                 streamInstance = stream;
                 console.log(`[WebSocket:Connect][${connectionId}] Attached terminal stream successfully.`);

                // --- Stream Piping: Docker Stream -> WebSocket Client ---
                stream.on('data', (chunk) => {
                     // console.log(`[Stream:Data][${connectionId}] Received ${chunk.length} bytes from Docker`);
                     if (ws.readyState === ws.OPEN) {
                         try { ws.send(chunk); } catch (e) { console.error(`[WebSocket:Error][${connectionId}] Send error:`, e); }
                     } else {
                         console.log(`[Stream:Data][${connectionId}] WebSocket not open (state: ${ws.readyState}), cannot send data.`);
                     }
                });

                // --- Stream Piping: WebSocket Client -> Docker Stream ---
                ws.on('message', (message) => {
                     // console.log(`[WebSocket:Message][${connectionId}] Received message from client`);
                     try {
                        const msgData = JSON.parse(message.toString());
                        if (msgData.type === 'resize' && msgData.cols && msgData.rows) {
                             console.log(`[WebSocket:Message][${connectionId}] Resizing PTY to ${msgData.cols}x${msgData.rows}`);
                             if (execInstance) {
                                 execInstance.resize({ w: msgData.cols, h: msgData.rows }, (resizeErr) => {
                                     if(resizeErr) console.error(`[WebSocket:Error][${connectionId}] PTY resize error:`, resizeErr);
                                 });
                             } else { console.error(`[WebSocket:Error][${connectionId}] Cannot resize, execInstance not available.`); }
                        } else { console.warn(`[WebSocket:Message][${connectionId}] Received unknown JSON message type:`, msgData.type); }
                     } catch (e) {
                        // If not JSON, assume it's raw terminal input data
                        if (streamInstance && !streamInstance.destroyed && streamInstance.writable) {
                             // console.log(`[Stream:Write][${connectionId}] Writing data to Docker stream...`);
                             streamInstance.write(message);
                        } else {
                             console.error(`[Stream:Error][${connectionId}] Stream not writable or destroyed, cannot forward input.`);
                        }
                     }
                });

                // --- Event Handlers for Cleanup ---
                stream.on('error', (streamErr) => {
                    console.error(`!!! [Stream:Error][${connectionId}] Docker stream error:`, streamErr);
                    cleanup('stream error');
                });
                ws.on('error', (wsErr) => {
                    console.error(`!!! [WebSocket:Error][${connectionId}] WebSocket error:`, wsErr);
                    cleanup('ws error');
                });
                stream.on('end', () => {
                    console.log(`[Stream:Event][${connectionId}] Docker stream ended.`);
                    cleanup('stream end');
                });
                 stream.on('close', () => {
                    console.log(`[Stream:Event][${connectionId}] Docker stream closed.`);
                    cleanup('stream close');
                });
                ws.on('close', (code, reason) => {
                    const reasonString = reason ? reason.toString() : 'N/A';
                    console.log(`[WebSocket:Event][${connectionId}] WebSocket closed. Code: ${code}, Reason: ${reasonString}`);
                    cleanup('ws close');
                });

             }); // end exec.start
        }); // end container.exec
    }); // end wss.on('connection')
    // --- End WebSocket Setup ---

    // Start the HTTP server
    server.listen(port, hostname, (err) => {
        if (err) { console.error("[Server] Failed to start server:", err); throw err; }
        console.log(`[Server] > Ready on http://${hostname}:${port}`);
    });

}).catch((err) => {
    console.error("[Server] Error during Next.js app preparation:", err);
    process.exit(1);
});

console.log('[Server] server.js script finished synchronous execution.');