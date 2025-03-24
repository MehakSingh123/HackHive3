// app/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import { AlertCircle, Server, Zap, Activity, Lock, Database, Shield } from "lucide-react";

export default function Home() {
  const [kaliStatus, setKaliStatus] = useState("Not Started");
  const [nmapResult, setNmapResult] = useState("");
  const [targetIP, setTargetIP] = useState("");
  const [commandHistory, setCommandHistory] = useState([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([
    { type: "system", content: "Terminal ready. Start Kali to begin." }
  ]);
  
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of terminal when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // Focus input when terminal becomes visible
  useEffect(() => {
    if (terminalVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [terminalVisible]);

  // Starts the Kali container by calling our API route
  const startKali = async () => {
    setKaliStatus("Starting...");
    addTerminalOutput("system", "Starting Kali Machine...");
    
    try {
      const res = await fetch("/api/start-kali", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        setKaliStatus("Started");
        addTerminalOutput("system", "Kali container started successfully.");
        addTerminalOutput("prompt", "root@kali:~#");
      } else {
        setKaliStatus("Error Starting Kali");
        addTerminalOutput("error", `Error: ${data.error}`);
      }
    } catch (error) {
      setKaliStatus("Error Starting Kali");
      addTerminalOutput("error", `Connection error: ${error.message}`);
    }
  };

  // Adds a new line to the terminal output
  const addTerminalOutput = (type, content) => {
    setTerminalOutput(prev => [...prev, { type, content }]);
  };

  // Process terminal commands
  const processCommand = async (command) => {
    addTerminalOutput("command", `root@kali:~# ${command}`);
    setCommandHistory(prev => [...prev, command]);
    
    if (command === "clear") {
      setTerminalOutput([]);
      return;
    }
    
    if (command.startsWith("nmap")) {
      // Extract target from nmap command
      const target = command.split(" ")[1];
      if (!target) {
        addTerminalOutput("error", "Usage: nmap [target]");
        addTerminalOutput("prompt", "root@kali:~#");
        return;
      }
      
      addTerminalOutput("output", `Starting Nmap scan on ${target}...`);
      
      try {
        const res = await fetch("/api/perform-nmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target }),
        });
        
        const data = await res.json();
        
        if (data.result) {
          addTerminalOutput("output", data.result);
          setNmapResult(data.result);
        } else {
          addTerminalOutput("error", `Error: ${data.error}`);
        }
      } catch (error) {
        addTerminalOutput("error", `Connection error: ${error.message}`);
      }
    } else if (command === "help") {
      addTerminalOutput("output", "Available commands: nmap, clear, help");
    } else {
      // For other commands, we would send to the backend
      addTerminalOutput("output", `Executing: ${command}`);
      
      try {
        const res = await fetch("/api/execute-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        });
        
        const data = await res.json();
        
        if (data.output) {
          addTerminalOutput("output", data.output);
        } else {
          addTerminalOutput("error", `Error: ${data.error}`);
        }
      } catch (error) {
        addTerminalOutput("error", `Connection error: ${error.message}`);
      }
    }
    
    addTerminalOutput("prompt", "root@kali:~#");
  };

  // Handle terminal input submission
  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    
    processCommand(terminalInput.trim());
    setTerminalInput("");
  };

  // Execute nmap from the target field in the sidebar
  const performNmap = async () => {
    if (!targetIP) {
      addTerminalOutput("error", "Please enter a target IP address.");
      return;
    }
    
    processCommand(`nmap ${targetIP}`);
  };

  // Tool cards data
  const tools = [
    {
      id: 1,
      name: "Network Mapper",
      icon: <Activity size={24} />,
      description: "Scan networks and discover hosts and services",
      action: performNmap,
      buttonText: "Run Nmap",
      enabled: kaliStatus === "Started"
    },
    {
      id: 2,
      name: "Vulnerability Scanner",
      icon: <Shield size={24} />,
      description: "Identify security vulnerabilities in systems",
      action: () => addTerminalOutput("system", "Vulnerability scan initiated"),
      buttonText: "Start Scan",
      enabled: kaliStatus === "Started"
    },
    {
      id: 3,
      name: "Password Cracker",
      icon: <Lock size={24} />,
      description: "Test password strength and security",
      action: () => addTerminalOutput("system", "Password cracking module loaded"),
      buttonText: "Launch Tool",
      enabled: kaliStatus === "Started"
    },
    {
      id: 4,
      name: "Database Explorer",
      icon: <Database size={24} />,
      description: "Examine database structures and vulnerabilities",
      action: () => addTerminalOutput("system", "Database explorer initialized"),
      buttonText: "Open Explorer",
      enabled: kaliStatus === "Started"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg py-4 px-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <Zap size={24} className="text-green-400" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">HackHive</h1>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li><a href="#" className="hover:text-green-400 transition-colors">Home</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">Tools</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">AI Assistant</a></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">Documentation</a></li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 p-4 flex flex-col shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Server size={20} className="mr-2" /> Dashboard
          </h2>
          
          <div className="p-4 mb-4 bg-gray-700 rounded-lg">
            <button 
              onClick={startKali} 
              disabled={kaliStatus === "Started" || kaliStatus === "Starting..."}
              className={`w-full mb-4 py-2 px-4 rounded-md font-medium transition-all ${
                kaliStatus === "Started" 
                  ? "bg-gray-600 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-500 active:scale-95"
              }`}
            >
              {kaliStatus === "Started" ? "Running" : kaliStatus === "Starting..." ? "Starting..." : "Start Kali Machine"}
            </button>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <span className={`px-2 py-1 rounded-md text-sm ${
                kaliStatus === "Started" 
                  ? "bg-green-600" 
                  : kaliStatus === "Starting..." 
                    ? "bg-yellow-600" 
                    : kaliStatus.startsWith("Error") 
                      ? "bg-red-600" 
                      : "bg-gray-600"
              }`}>
                {kaliStatus}
              </span>
            </div>
          </div>
          
          {kaliStatus === "Started" && (
            <div className="mt-2 space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <AlertCircle size={18} className="mr-2 text-blue-400" />
                Target Settings
              </h3>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <label className="block mb-2 text-sm font-medium">Target IP or Hostname:</label>
                <input 
                  type="text" 
                  value={targetIP} 
                  onChange={(e) => setTargetIP(e.target.value)} 
                  placeholder="e.g., 192.168.1.100" 
                  className="w-full p-2 rounded-md bg-gray-600 border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
                
                <button 
                  onClick={performNmap} 
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white py-2 px-4 rounded-md transition-all font-medium"
                >
                  Scan Target
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-auto text-xs text-gray-400">
            <p>Kali Linux Integration v1.2.0</p>
            <p>© {new Date().getFullYear()} HackHive</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Penetration Testing Tools</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tools.map(tool => (
                <div 
                  key={tool.id} 
                  className={`bg-gray-800 p-5 rounded-lg shadow-lg border-l-4 ${
                    tool.enabled ? "border-green-500" : "border-gray-600"
                  } transition-all hover:transform hover:translate-y-[-2px]`}
                >
                  <div className="flex items-center mb-3">
                    <div className={`p-2 rounded-md ${tool.enabled ? "bg-green-900/40" : "bg-gray-700"} mr-3`}>
                      {tool.icon}
                    </div>
                    <h3 className="text-lg font-medium">{tool.name}</h3>
                  </div>
                  
                  <p className="text-gray-400 mb-4 text-sm">{tool.description}</p>
                  
                  <button 
                    onClick={tool.action}
                    disabled={!tool.enabled} 
                    className={`w-full py-2 px-4 rounded-md font-medium transition-all ${
                      tool.enabled 
                        ? "bg-blue-600 hover:bg-blue-500 active:scale-95" 
                        : "bg-gray-700 cursor-not-allowed text-gray-400"
                    }`}
                  >
                    {tool.buttonText}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {nmapResult && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3 flex items-center">
                <Activity size={20} className="mr-2 text-blue-400" />
                Scan Results
              </h2>
              
              <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Nmap Results for {targetIP}</h3>
                  <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-1 rounded">
                    Analysis Complete
                  </span>
                </div>
                
                <div className="bg-gray-900 p-3 rounded font-mono text-sm overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{nmapResult}</pre>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">AI Analysis & Insights</h2>
            
            <div className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="bg-purple-900/40 p-2 rounded-md mr-3">
                  <Zap size={20} className="text-purple-400" />
                </div>
                <h3 className="font-medium">AI Security Assistant</h3>
              </div>
              
              <p className="text-gray-400 mb-4">
                The AI assistant can analyze scan results, recommend security improvements, and help interpret findings.
              </p>
              
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                {!nmapResult ? (
                  <p className="text-gray-400 text-sm">
                    Run a scan to receive AI-powered analysis and recommendations.
                  </p>
                ) : (
                  <div>
                    <h4 className="font-medium mb-2 text-purple-300">Findings Summary</h4>
                    <p className="text-sm text-gray-300 mb-3">
                      Based on the Nmap scan of {targetIP}, I've detected several open ports that might indicate potential vulnerabilities.
                    </p>
                    <h4 className="font-medium mb-2 text-purple-300">Recommendations</h4>
                    <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
                      <li>Consider closing unnecessary ports to reduce attack surface</li>
                      <li>Update any outdated services detected in the scan</li>
                      <li>Run more detailed vulnerability scans on open services</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <button 
                className={`w-full py-2 px-4 rounded-md font-medium transition-all ${
                  nmapResult ? "bg-purple-600 hover:bg-purple-500 active:scale-95" : "bg-gray-700 cursor-not-allowed text-gray-400"
                }`}
                disabled={!nmapResult}
              >
                Request Detailed Analysis
              </button>
            </div>
          </div>
        </main>
      </div>
      
      {/* Floating Terminal Button */}
      <button
        onClick={() => setTerminalVisible(!terminalVisible)}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-500 text-white p-3 rounded-full shadow-lg z-30 transition-all active:scale-95"
        title="Toggle Terminal"
      >
        <Terminal size={24} />
      </button>
      
      {/* Terminal Window */}
      {terminalVisible && (
        <div className="fixed inset-x-0 bottom-0 bg-black/90 border-t border-green-800 h-72 z-20 shadow-2xl flex flex-col">
          <div className="bg-gray-900 px-4 py-2 border-b border-green-800 flex justify-between items-center">
            <div className="flex items-center">
              <Terminal size={16} className="text-green-500 mr-2" />
              <h3 className="font-mono text-green-500">Kali Terminal</h3>
            </div>
            <button 
              onClick={() => setTerminalVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div 
            ref={terminalRef}
            className="flex-1 font-mono text-sm p-2 overflow-y-auto bg-black"
          >
            {terminalOutput.map((line, index) => (
              <div key={index} className="mb-1">
                {line.type === "system" && (
                  <span className="text-yellow-500">[SYSTEM] {line.content}</span>
                )}
                {line.type === "error" && (
                  <span className="text-red-500">{line.content}</span>
                )}
                {line.type === "command" && (
                  <span className="text-white">{line.content}</span>
                )}
                {line.type === "output" && (
                  <span className="text-gray-300">{line.content}</span>
                )}
                {line.type === "prompt" && (
                  <span className="text-green-500">{line.content}</span>
                )}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleTerminalSubmit} className="px-2 py-2 border-t border-gray-800 bg-black flex">
            <span className="text-green-500 font-mono mr-2">root@kali:~#</span>
            <input
              ref={inputRef}
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder={kaliStatus === "Started" ? "Enter command..." : "Start Kali to use terminal..."}
              disabled={kaliStatus !== "Started"}
              className="flex-1 bg-transparent border-none outline-none font-mono text-white"
              autoComplete="off"
            />
          </form>
        </div>
      )}
    </div>
  );
}