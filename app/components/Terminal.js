"use client";
import { TerminalIcon, X, Minimize, Maximize } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTerminalContext } from "../contexts/TerminalContext";

export default function Terminal() {
  const {
    terminalOutput,
    terminalInput,
    setTerminalInput,
    terminalVisible,
    setTerminalVisible,
    terminalRef,
    addTerminalOutput,
  } = useTerminalContext();

  const inputRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // Focus input when terminal becomes visible
  useEffect(() => {
    if (terminalVisible && inputRef.current && !minimized) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [terminalVisible, minimized]);

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // WebSocket connection handling
  useEffect(() => {
    if (!terminalVisible || wsRef.current) return;

    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:3001');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addTerminalOutput('system', 'Connected to backend shell');
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          addTerminalOutput(msg.type, msg.content);
        } catch (error) {
          addTerminalOutput('error', 'Invalid server response');
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        addTerminalOutput('system', 'Connection closed');
        wsRef.current = null;
        
        // Try to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        addTerminalOutput('error', 'WebSocket error');
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [terminalVisible, addTerminalOutput]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd || !isConnected) return;

    // Send command only if WebSocket is open
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(cmd);
      setTerminalInput('');
      
      // Refocus the input after submission
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      addTerminalOutput('error', 'Not connected to server');
    }
  };

  if (!terminalVisible) return (
    <button
      onClick={() => setTerminalVisible(true)}
      className="fixed bottom-6 right-6 bg-blue-500 text-white p-3 rounded-lg shadow-xl"
    >
      <TerminalIcon size={20} />
    </button>
  );

  return (
    <div className={`fixed inset-x-0 ${minimized ? 'h-12' : 'h-96'} bottom-0 bg-gray-900 border-t border-blue-500 z-50`}>
      <div className="bg-gray-800 p-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TerminalIcon className="text-blue-400" />
          <span className="text-blue-400 font-mono">Kali Terminal</span>
          <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMinimized(!minimized)} className="text-gray-300 hover:text-white">
            {minimized ? <Maximize size={16} /> : <Minimize size={16} />}
          </button>
          <button onClick={() => setTerminalVisible(false)} className="text-gray-300 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div 
            ref={terminalRef} 
            className="h-72 p-4 overflow-y-auto font-mono text-sm bg-gray-900 text-gray-200"
            onClick={() => inputRef.current && inputRef.current.focus()}
          >
            {terminalOutput.map((line, i) => (
              <div key={i} className={`${
                line.type === 'system' ? 'text-yellow-500' :
                line.type === 'error' ? 'text-red-400' :
                line.type === 'command' ? 'text-green-300' :
                line.type === 'output' ? 'text-gray-300' :
                line.type === 'prompt' ? 'text-blue-400' :
                'text-gray-300'
              }`}>
                {line.content}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="p-2 border-t border-gray-700 flex items-center">
            <span className="text-blue-400 font-mono mr-2">
              {isConnected ? '>' : '·'}
            </span>
            <input
              ref={inputRef}
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              className="w-full bg-transparent text-white focus:outline-none font-mono"
              placeholder={isConnected ? "Enter command..." : "Connecting..."}
              disabled={!isConnected}
              autoFocus
            />
          </form>
        </>
      )}
    </div>
  );
}