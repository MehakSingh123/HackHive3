"use client";

import React, { useEffect, useRef, useState, useContext } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { VMContext } from "../contexts/VMContext";
import { useWindowManager } from "../contexts/WindowManagerContext";

function TerminalComponent() {
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const websocket = useRef(null);
  const lastCommandTimestamp = useRef(null);
  
  const { vmStatus, containerId } = useContext(VMContext);
  const { commandToRun, clearCommandToRun } = useWindowManager();
  
  const [isConnected, setIsConnected] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [overlayMessage, setOverlayMessage] = useState("Initializing...");
  const [inputText, setInputText] = useState("");

  const terminalConfig = {
    rows: 24,
    cols: 80,
    cursorBlink: true,
    fontSize: 14,
    fontFamily: "monospace",
    theme: {
      background: "#0A192F",
      foreground: "#E0E0E0",
      cursor: "#E0E0E0",
    },
    scrollback: 1000,
  };

  const sendToServer = (data) => {
    if (websocket.current?.readyState === WebSocket.OPEN) {
      try {
        websocket.current.send(data);
        console.log(`Sent: "${data}"`);
        return true;
      } catch (error) {
        console.error("Send error:", error);
        return false;
      }
    }
    console.error("WebSocket not ready");
    return false;
  };

  const sendKey = (key) => {
    if (key === "\x7F" || key === "\b") {
      terminal.current?.write("\b \b");
    } else if (/^\d$/.test(key)) {
      terminal.current?.write(key);
    }
    sendToServer(key);
  };

  const handleNumberClick = (num) => {
    const numStr = num.toString();
    console.log(`Number clicked: ${numStr}`);
    terminal.current?.write(numStr);
    sendToServer(numStr);
    focusTerminal();
  };

  const cleanup = () => {
    console.log("Cleaning up terminal");
    
    if (websocket.current) {
      if (websocket.current.readyState <= WebSocket.OPEN) {
        websocket.current.close(1000, "Component cleanup");
      }
      websocket.current = null;
    }
    
    if (terminal.current) {
      terminal.current.dispose();
      terminal.current = null;
    }
  };

  const getOverlayMessage = () => {
    if (vmStatus === "Loading..." || vmStatus === "Checking...") {
      return "Checking VM status...";
    }
    if (vmStatus === "Starting...") {
      return "VM is starting...";
    }
    if (vmStatus === "Stopping...") {
      return "VM is stopping...";
    }
    if (vmStatus === "Stopped" || vmStatus === "Not Found") {
      return "VM is stopped. Please start it.";
    }
    if (vmStatus.startsWith("Error")) {
      return `VM Error: ${vmStatus.split(": ")[1] || "Unknown"}. Try restarting.`;
    }
    if (vmStatus !== "Started") {
      return `VM Status: ${vmStatus}. Terminal requires 'Started' state.`;
    }
    if (!containerId) {
      return "VM Started, but container ID missing.";
    }
    return "";
  };

  const initializeTerminal = () => {
    console.log(`Initializing terminal for container: ${containerId}`);

    try {
      terminal.current = new Terminal(terminalConfig);
      terminal.current.open(terminalRef.current);
      terminal.current.focus();

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/terminal?containerId=${encodeURIComponent(containerId)}`;
      
      console.log(`Connecting to: ${wsUrl}`);
      websocket.current = new WebSocket(wsUrl);

      websocket.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        terminal.current?.writeln("\r\n\x1b[32mConnected.\x1b[0m");
        terminal.current?.scrollToBottom();
        terminal.current?.focus();
      };

      websocket.current.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
        setIsConnected(false);
        terminal.current?.writeln(`\r\n\x1b[31mConnection closed (Code: ${event.code}).\x1b[0m`);
        terminal.current?.scrollToBottom();
        
        if (!event.wasClean && !showOverlay) {
          setShowOverlay(true);
          setOverlayMessage(`Connection lost (Code: ${event.code}). Check VM status or refresh.`);
        }
      };

      websocket.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      websocket.current.onmessage = (event) => {
        if (!terminal.current) return;

        try {
          let data;
          
          if (event.data instanceof Blob) {
            event.data.arrayBuffer().then((buffer) => {
              if (terminal.current) {
                terminal.current.write(new Uint8Array(buffer));
                terminal.current.scrollToBottom();
              }
            });
            return;
          }
          
          if (typeof event.data === "string") {
            data = event.data;
          } else if (event.data instanceof ArrayBuffer) {
            data = new Uint8Array(event.data);
          } else {
            console.warn("Unexpected data type:", typeof event.data);
            return;
          }

          if (data) {
            terminal.current.write(data);
            terminal.current.scrollToBottom();
          }
        } catch (error) {
          console.error("Message handling error:", error);
        }
      };

      terminal.current.onData((data) => {
        console.log(`Terminal input: "${data}"`);
        
        if (data === "\x7F" || data === "\b") {
          terminal.current.write("\b \b");
        } else if (/^\d$/.test(data) && data.length === 1) {
          terminal.current.write(data);
        }
        
        sendToServer(data);
      });

      terminal.current.onKey(({ key, domEvent }) => {
        // Key listener for special handling if needed
      });

      terminal.current.writeln("\x1b[33mTerminal initialized. Connecting...\x1b[0m");
      terminal.current.scrollToBottom();
      
    } catch (error) {
      console.error("Terminal initialization error:", error);
      setShowOverlay(true);
      setOverlayMessage(`Terminal failed to initialize: ${error.message}`);
      cleanup();
    }
  };

  useEffect(() => {
    console.log(`Terminal effect - Status: ${vmStatus}, Container: ${containerId}`);
    
    const message = getOverlayMessage();
    
    if (message) {
      console.log("Showing overlay:", message);
      cleanup();
      setShowOverlay(true);
      setOverlayMessage(message);
      return;
    }
    
    setShowOverlay(false);
    
    if (vmStatus === "Started" && containerId && !terminal.current && terminalRef.current) {
      initializeTerminal();
    }
    
    return cleanup;
  }, [vmStatus, containerId]);

  useEffect(() => {
    if (commandToRun?.cmd && commandToRun.timestamp > (lastCommandTimestamp.current || 0)) {
      console.log(`Processing command: ${commandToRun.cmd.trim()}`);
      
      const command = commandToRun.cmd.endsWith("\n") || commandToRun.cmd.endsWith("\r") 
        ? commandToRun.cmd 
        : `${commandToRun.cmd}\r`;
      
      if (sendToServer(command)) {
        lastCommandTimestamp.current = commandToRun.timestamp;
      } else {
        console.warn("Failed to send command - WebSocket not ready");
      }
      
      clearCommandToRun();
    }
  }, [commandToRun, clearCommandToRun]);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (inputText) {
      sendToServer(inputText + "\r");
      setInputText("");
      focusTerminal();
    }
  };

  const focusTerminal = () => {
    if (terminal.current && !showOverlay) {
      terminal.current.focus();
    }
  };

  const specialKeys = [
    { label: "Tab", key: "\t" },
    { label: "Ctrl+C", key: "\x03" },
    { label: "Ctrl+D", key: "\x04" },
    { label: "Enter", key: "\r" },
    { label: "Space", key: " " },
    { label: "Backspace", key: "\x7F" },
  ];

  const buttonStyle = {
    margin: "2px",
    padding: "8px 12px",
    background: "#1E3A60",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  };

  const specialButtonStyle = { 
    ...buttonStyle, 
    background: "#2A4A77" 
  };

  return (
    <div style={{
      width: "100%",
      height: "100%",
      position: "relative",
      background: "#0A192F",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {showOverlay && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(10, 25, 47, 0.85)",
          color: "#ccc",
          fontSize: "1.1em",
          zIndex: 10,
          padding: "20px",
          textAlign: "center",
        }}>
          {overlayMessage}
        </div>
      )}

      <div 
        style={{ flex: 1, position: "relative", minHeight: "200px" }}
        onClick={focusTerminal}
      >
        <div
          ref={terminalRef}
          style={{
            width: "100%",
            height: "100%",
            visibility: showOverlay ? "hidden" : "visible",
          }}
        />
      </div>

      {!showOverlay && (
        <div style={{
          padding: "8px",
          background: "#0F2947",
          borderTop: "1px solid #2A385B",
          flexShrink: 0,
        }}>
          <div style={{
            marginBottom: "8px",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            {Array.from({ length: 10 }, (_, i) => (
              <button
                key={i}
                onClick={() => handleNumberClick(i)}
                style={buttonStyle}
              >
                {i}
              </button>
            ))}
          </div>

          <div style={{
            marginBottom: "8px",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            {specialKeys.map(({ label, key }) => (
              <button
                key={label}
                onClick={() => {
                  sendKey(key);
                  focusTerminal();
                }}
                style={specialButtonStyle}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleInputSubmit} style={{ display: "flex" }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type text to send..."
              style={{
                flex: 1,
                padding: "8px",
                background: "#162B44",
                color: "white",
                border: "1px solid #2A385B",
                borderRadius: "4px 0 0 4px",
                outline: "none",
                fontSize: "14px",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                background: "#264F82",
                color: "white",
                border: "none",
                borderRadius: "0 4px 4px 0",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default TerminalComponent;