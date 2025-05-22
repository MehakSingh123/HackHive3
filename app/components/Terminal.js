'use client';

import React, { useEffect, useRef, useState, useContext } from 'react';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { VMContext } from '../contexts/VMContext';
import { useWindowManager } from '../contexts/WindowManagerContext';

// Add the following option to fix number key issues
const terminalOptions = {
    rows: 25,
    cols: 80,
    cursorBlink: true,
    fontSize: 14,
    theme: {
        background: '#0A192F',
        foreground: '#E0E0E0',
        cursor: '#E0E0E0',
    },
    allowProposedApi: true, // May be needed for some xterm features
    disableStdin: false, // Ensure stdin is enabled
    screenReaderMode: false, // Disable screen reader mode which can affect input
    convertEol: true, // Convert EOL characters
    // This is a key addition - define a custom key bindings handler
    customKeyEventHandler: (event) => {
        // Don't intercept any keyboard events - let them all pass through
        return true;
    }
};

function TerminalComponent() {
    const terminalRef = useRef(null);
    const termInstance = useRef(null);
    const wsInstance = useRef(null);
    const dataListener = useRef(null);
    const lastProcessedTimestampRef = useRef(null);
    const { vmStatus, containerId } = useContext(VMContext);
    const { commandToRun, clearCommandToRun } = useWindowManager();
    const [isConnected, setIsConnected] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);
    const [overlayMessage, setOverlayMessage] = useState("Initializing...");

    // --- Main Setup Effect ---
    useEffect(() => {
        console.log(`Terminal Effect Run. Status: ${vmStatus}, ID: ${containerId}`);
        let isMounted = true;

        // --- Define Cleanup Logic ---
        const cleanup = (caller) => {
             console.log(`Cleanup: Starting (called by ${caller}). isMounted: ${isMounted}`);
             if (!isMounted && caller !== 'effect return') return;
             isMounted = false;

             if (dataListener.current) { console.log('Cleanup: Disposing data listener'); dataListener.current.dispose(); dataListener.current = null; }

             if (wsInstance.current) {
                 console.log(`Cleanup: Closing WebSocket (state: ${wsInstance.current.readyState})`);
                 if (wsInstance.current.readyState === WebSocket.OPEN || wsInstance.current.readyState === WebSocket.CONNECTING) {
                     wsInstance.current.close(1000, "Component cleanup");
                 }
                 wsInstance.current = null;
             }
             if (termInstance.current) {
                 console.log('Cleanup: Disposing xterm instance');
                 termInstance.current.dispose();
                 termInstance.current = null;
             }
             console.log(`Cleanup: Finished (called by ${caller}).`);
        };

        // --- Update Overlay Based on Status ---
        let currentOverlayMessage = "Terminal unavailable.";
        if (vmStatus === "Loading..." || vmStatus === "Checking...") { currentOverlayMessage = "Checking VM status..."; }
        else if (vmStatus === "Starting...") { currentOverlayMessage = "VM is starting..."; }
        else if (vmStatus === "Stopping...") { currentOverlayMessage = "VM is stopping..."; }
        else if (vmStatus === "Stopped" || vmStatus === "Not Found") { currentOverlayMessage = "VM is stopped. Please start it."; }
        else if (vmStatus.startsWith("Error")) { currentOverlayMessage = `VM Error: ${vmStatus.split(': ')[1] || 'Unknown'}. Try restarting.`; }
        else if (vmStatus !== "Started") { currentOverlayMessage = `VM Status: ${vmStatus}. Terminal requires 'Started' state.` }
        else if (!containerId) { currentOverlayMessage = "VM Started, but container ID missing."; }
        else { currentOverlayMessage = ""; } // No message if ready

        if (currentOverlayMessage) {
            console.log("Terminal Effect: Showing Overlay -", currentOverlayMessage);
            setShowOverlay(true);
            setOverlayMessage(currentOverlayMessage);
            cleanup('status not ready');
            return;
        }

        // --- Proceed only if VM is Started with ID and not already initialized ---
        if (!terminalRef.current || termInstance.current) {
            console.log(`Terminal Effect: Skipping init (Ref exists: ${!!terminalRef.current}, Term exists: ${!!termInstance.current})`);
            return;
        }

        // --- Initialize Terminal ---
        console.log(`Init: Initializing terminal for container: ${containerId}`);
        setShowOverlay(false);

        try {
            termInstance.current = new Terminal(terminalOptions);
            termInstance.current.open(terminalRef.current);
            console.log('Init: Terminal opened on element.');
            termInstance.current.focus();

            // --- WebSocket Setup ---
            const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = `${proto}//${host}/api/terminal?containerId=${encodeURIComponent(containerId)}`;
            console.log(`Init: Connecting WebSocket to: ${wsUrl}`);
            wsInstance.current = new WebSocket(wsUrl);
            setIsConnected(false);

            // --- WebSocket Event Handlers ---
            wsInstance.current.onopen = () => {
                console.log('WS: onopen event fired. isMounted:', isMounted);
                if (!isMounted) { console.log('WS: onopen - Bailing: Component unmounted.'); return; }
                console.log('WS: onopen - Setting isConnected = true');
                setIsConnected(true);
                if (termInstance.current) {
                    console.log('WS: onopen - Terminal instance exists.');
                    console.log('WS: onopen - Writing "Connected." to terminal...');
                    try {
                         termInstance.current.writeln('\x1b[32mConnected.\x1b[0m');
                         console.log('WS: onopen - Focusing terminal...');
                         termInstance.current.focus();
                    } catch(termError) { console.error("WS: onopen - Error interacting with terminal instance:", termError); }
                    console.log('WS: onopen - handler finished execution.');
                } else { console.warn('WS: onopen - termInstance not ready when onopen fired.'); }
            };
            wsInstance.current.onclose = (event) => {
                console.log(`WS: WebSocket Disconnected. Code: ${event.code}, Reason: ${event.reason || 'N/A'}, Clean: ${event.wasClean}, isMounted: ${isMounted}`);
                if (!isMounted) return;
                setIsConnected(false);
                if (termInstance.current) {
                    try {
                        termInstance.current.writeln(`\r\n\x1b[31mConnection closed (Code: ${event.code}).\x1b[0m`);
                    } catch (e) { console.error("Error writing close message to term:", e);}
                }
            };
            wsInstance.current.onerror = (error) => {
                console.error('WS: WebSocket Error:', error);
                 if (!isMounted) return;
                 // Error usually precedes close
            };
            wsInstance.current.onmessage = (event) => {
                if (!isMounted || !termInstance.current) return;
                 try {
                     if (event.data instanceof Blob) {
                         const reader = new FileReader();
                         reader.onload = () => termInstance.current?.write(new Uint8Array(reader.result));
                         reader.readAsArrayBuffer(event.data);
                     } else if (typeof event.data === 'string') {
                         termInstance.current?.write(event.data);
                     } else if (event.data instanceof ArrayBuffer) {
                         termInstance.current?.write(new Uint8Array(event.data));
                     }
                 } catch (writeError) {
                     console.error("WS: onmessage - Error writing to terminal:", writeError);
                 }
            };

            // --- Xterm.js Input Handler ---
            console.log('Init: Attaching onData listener...');
            dataListener.current = termInstance.current.onData((data) => {
                if (wsInstance.current && wsInstance.current.readyState === WebSocket.OPEN) {
                    // Format the data as expected by the server
                    // Try sending the raw data directly without JSON formatting
                    try {
                        // Just send the raw data as-is
                        wsInstance.current.send(data);
                        
                        // Debug logging for number keys
                        if (data.length === 1 && data.charCodeAt(0) >= 48 && data.charCodeAt(0) <= 57) {
                            console.log(`Sending number key: ${data} (${data.charCodeAt(0)})`);
                        }
                    } catch (error) {
                        console.error('Error sending data:', error);
                    }
                } else { 
                    console.error('WebSocket not ready when trying to send data.'); 
                }
            });

        } catch (initError) {
             console.error("!!! Init: Error during terminal initialization:", initError);
             setShowOverlay(true);
             setOverlayMessage("Terminal Initialization Failed.");
             cleanup('init error');
        }

        // --- Return Cleanup Function from useEffect ---
        return () => cleanup('effect return');

    }, [vmStatus, containerId]);

    useEffect(() => {
        // Check if commandToRun exists, has content, and is new
        if (commandToRun && commandToRun.cmd && commandToRun.timestamp > (lastProcessedTimestampRef.current || 0)) {
             console.log(`TerminalComponent: Processing command from context (ts: ${commandToRun.timestamp}):`, commandToRun.cmd.trim());
            const currentWs = wsInstance.current;

            if (currentWs && currentWs.readyState === WebSocket.OPEN) {
                console.log("TerminalComponent: Sending command via WebSocket...");
                currentWs.send(commandToRun.cmd);
                lastProcessedTimestampRef.current = commandToRun.timestamp;
            } else {
                 console.error(`TerminalComponent: Cannot send command from context, WebSocket not OPEN (state: ${currentWs?.readyState}).`);
                 const currentTerm = termInstance.current;
                 currentTerm?.writeln(`\r\n\x1b[31m[Cannot execute received command: Not connected]\x1b[0m`);
            }
             clearCommandToRun();

        } else if (commandToRun && commandToRun.timestamp <= (lastProcessedTimestampRef.current || 0)) {
             // Log if we skipped processing an already seen command timestamp
             // console.log("TerminalComponent: Skipping already processed command timestamp:", commandToRun.timestamp);
        }
    }, [commandToRun, clearCommandToRun]);

    // Add click handler to focus terminal when container is clicked
    const handleContainerClick = () => {
        if (termInstance.current && !showOverlay) {
            termInstance.current.focus();
        }
    };

    return (
        <div 
            style={{ width: '100%', height: '600px', position: 'relative', background: '#0A192F', overflow: 'hidden' }}
            onClick={handleContainerClick}
        >
           {showOverlay && (
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10, 25, 47, 0.85)', color: '#ccc', fontSize: '1.1em', zIndex: 10, padding: '20px', textAlign: 'center' }}>
                   {overlayMessage}
               </div>
           )}
          <div
              ref={terminalRef}
              style={{
                  width: '100%',
                  height: '100%',
                  minWidth: '400px',
                  minHeight: '300px',
                  visibility: showOverlay ? 'hidden' : 'visible'
               }}
           />
        </div>
    );
}

export default TerminalComponent;