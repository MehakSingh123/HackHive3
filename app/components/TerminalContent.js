// components/TerminalContent.js (New - Extracted from Terminal.js)
"use client";
import { useEffect, useRef, useState } from "react";
import { useTerminalContext } from "../contexts/TerminalContext"; // Keep using its output/input logic

export default function TerminalContent() {
    const {
        terminalOutput,
        terminalInput,
        setTerminalInput,
        terminalRef, // Use the ref passed from context for scrolling
        addTerminalOutput,
    } = useTerminalContext();

    const inputRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);

     // --- WebSocket and Scroll Logic (Keep as is from original Terminal.js) ---
     // Focus input when terminal becomes visible (handled by window focus now, but keep focus logic)
     useEffect(() => {
         if (inputRef.current) {
             setTimeout(() => inputRef.current.focus(), 100); // Focus on mount/render
         }
     }, []);

     // Auto-scroll to bottom when new output is added
     useEffect(() => {
         if (terminalRef.current) {
             terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
         }
     }, [terminalOutput, terminalRef]); // Add terminalRef dependency

     // WebSocket connection handling
     useEffect(() => {
         // Only establish WebSocket if it doesn't exist
         if (wsRef.current) return;

         const connectWebSocket = () => {
             // Use environment variable for WebSocket URL if available, otherwise default
             const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
             console.log("Attempting to connect WebSocket to:", wsUrl); // Log URL
             const ws = new WebSocket(wsUrl);
             wsRef.current = ws;

             ws.onopen = () => {
                 console.log("WebSocket Connected");
                 setIsConnected(true);
                 addTerminalOutput('system', 'Connected to backend shell.');
             };

             ws.onmessage = (e) => {
                 try {
                     // Assuming server sends plain text output directly now based on previous context
                     addTerminalOutput('output', e.data);
                 } catch (error) {
                     console.error("Error processing WebSocket message:", error);
                     addTerminalOutput('error', 'Invalid server response format.');
                 }
             };

             ws.onclose = (event) => {
                 console.log("WebSocket Closed:", event.code, event.reason);
                 setIsConnected(false);
                 if (!event.wasClean) {
                      addTerminalOutput('error', `Connection lost (Code: ${event.code}). Attempting to reconnect...`);
                      // Simple reconnect logic (consider exponential backoff for production)
                       setTimeout(connectWebSocket, 5000);
                 } else {
                     addTerminalOutput('system', 'Connection closed.');
                 }
                 wsRef.current = null;
             };

             ws.onerror = (error) => {
                 console.error('WebSocket error:', error);
                 // Check if it's a connection refused error
                 if (error.type === 'error' ) {
                    addTerminalOutput('error', 'WebSocket connection failed. Is the backend server running?');
                 } else {
                    addTerminalOutput('error', 'WebSocket error occurred.');
                 }
                 // Ensure cleanup if error happens before open
                 if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
                      wsRef.current = null;
                      setIsConnected(false);
                      // Optionally attempt reconnect on error too
                      // setTimeout(connectWebSocket, 5000);
                 }
             };
         };

         connectWebSocket();

         // Cleanup function to close WebSocket when component unmounts
         return () => {
             if (wsRef.current) {
                  console.log("Closing WebSocket connection.");
                 wsRef.current.close(1000, "Client disconnecting"); // Code 1000 for normal closure
                 wsRef.current = null;
             }
         };
     }, [addTerminalOutput]); // Run only once on mount

     const handleSubmit = (e) => {
         e.preventDefault();
         const cmd = terminalInput.trim();
         if (!cmd || !isConnected) return;

         if (wsRef.current?.readyState === WebSocket.OPEN) {
             // Add command to output locally first for immediate feedback
             addTerminalOutput('command', `$ ${cmd}`);
             wsRef.current.send(cmd);
             setTerminalInput('');
             if (inputRef.current) inputRef.current.focus();
         } else {
             addTerminalOutput('error', 'Not connected to server.');
         }
     };
    // --- End of kept logic ---

    // No Rnd, no visibility toggle button needed here
    return (
        <div className="flex flex-col h-full font-mono text-sm bg-[#050a0e] text-gray-200 p-1" onClick={() => inputRef.current?.focus()}>
            {/* Output Area */}
            <div
                ref={terminalRef} // Use the ref from context here
                className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
            >
                {terminalOutput.map((line, i) => (
                     <div key={i} className={`whitespace-pre-wrap break-words ${
                        line.type === 'system' ? 'text-yellow-400/90' :
                        line.type === 'error' ? 'text-red-400' :
                        line.type === 'command' ? 'text-green-300' : // User command echo
                        line.type === 'output' ? 'text-gray-300' :
                        'text-gray-300' // Default for other types like prompt
                    }`}>
                        {/* Render prompt if it's part of the content */}
                        {line.content}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-2 border-t border-gray-700/50 flex items-center">
                 <span className={`font-semibold mr-2 ${isConnected ? 'text-cyan-400' : 'text-gray-500'}`}>
                     {isConnected ? '$' : '·'} {/* Use $ as prompt prefix */}
                 </span>
                <input
                    ref={inputRef}
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    className="w-full bg-transparent text-gray-100 focus:outline-none"
                    placeholder={isConnected ? "Enter command..." : "Connecting..."}
                    disabled={!isConnected}
                    autoFocus
                    spellCheck="false"
                    autoComplete="off"
                />
            </form>
        </div>
    );
}