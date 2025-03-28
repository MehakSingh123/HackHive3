// components/Tools.js
"use client";
import { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ToolCard from "./ToolCard";
import { Activity, Database, Lock, Shield, Terminal } from "lucide-react";
import { VMContext } from "../contexts/VMContext";
import { TerminalContext } from "../contexts/TerminalContext";

export default function Tools() {
  const { vmStatus } = useContext(VMContext);
  const { addTerminalOutput, processCommand } = useContext(TerminalContext);
  const [expandedToolId, setExpandedToolId] = useState(null);
  const [nmapOptions, setNmapOptions] = useState({
    target: "",
    scanType: "quick",
    ports: "",
    osDetection: false,
    serviceVersion: true,
  });
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const tools = [
    {
      id: 1,
      name: "Network Mapper",
      icon: <Activity size={24} />,
      description: "Scan networks and discover hosts and services",
      enabled: vmStatus === "Started",
    },
    {
      id: 2,
      name: "Vulnerability Scanner",
      icon: <Shield size={24} />,
      description: "Identify security vulnerabilities in systems",
      action: () => addTerminalOutput("system", "Vulnerability scan initiated"),
      buttonText: "Start Scan",
      enabled: vmStatus === "Started",
    },
    {
      id: 3,
      name: "Password Cracker",
      icon: <Lock size={24} />,
      description: "Test password strength and security",
      action: () => addTerminalOutput("system", "Password cracking module loaded"),
      buttonText: "Launch Tool",
      enabled: vmStatus === "Started",
    },
    {
      id: 4,
      name: "Database Explorer",
      icon: <Database size={24} />,
      description: "Examine database structures and vulnerabilities",
      action: () => addTerminalOutput("system", "Database explorer initialized"),
      buttonText: "Open Explorer",
      enabled: vmStatus === "Started",
    },
  ];

  const handleNmapScan = async () => {
    setIsScanning(true);
    let command = `nmap ${nmapOptions.target} `;
    
    const scanTypes = {
      quick: "-T4 -F",
      full: "-p- -sV -O",
      udp: "-sU",
      custom: `${nmapOptions.ports ? `-p ${nmapOptions.ports}` : ""} 
              ${nmapOptions.osDetection ? "-O " : ""}
              ${nmapOptions.serviceVersion ? "-sV " : ""}`
    };
    
    command += scanTypes[nmapOptions.scanType];
    addTerminalOutput("command", `root@vm:~# ${command}`);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      
      const data = await res.json();
      const rawOutput = data.output;
      
      // AI Processing
      const analysis = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Analyze these nmap results:\n${rawOutput}\n` +
                     `Format as markdown with: Summary, Open Ports table, ` +
                     `Vulnerabilities (CVSS >7), and Recommendations.`
          }]
        }),
      });
      
      const aiData = await analysis.json();
      setScanResults({ raw: rawOutput, analyzed: aiData.content });
      
    } catch (error) {
      addTerminalOutput("error", `Scan failed: ${error.message}`);
      setScanResults(null);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Penetration Testing Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div key={tool.id} className="relative">
              <AnimatePresence>
                {expandedToolId === tool.id ? (
                  // Expanded Nmap Card (75% of window)
                  <motion.div
                    key="expanded"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="fixed inset-0 m-auto z-20 bg-gray-800 rounded-xl shadow-2xl p-6 border-2 border-blue-500"
                    style={{
                      width: '75vw',
                      height: '75vh',
                      maxWidth: '1200px',
                      maxHeight: '800px'
                    }}
                  >
                    <div className="h-full flex flex-col">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-700">
                        <h3 className="text-2xl font-bold flex items-center gap-3">
                          <Activity size={28} className="text-blue-400" />
                          Network Mapper
                        </h3>
                        <button 
                          onClick={() => setExpandedToolId(null)}
                          className="text-gray-300 hover:text-white text-2xl p-2"
                        >
                          ×
                        </button>
                      </div>

                      {/* Scrollable Content Area */}
                      <div className="flex-1 overflow-y-auto pr-4">
                        <div className="grid grid-cols-2 gap-6 mb-6">
                          {/* Left Column - Configuration */}
                          <div className="space-y-6">
                            <div>
                              <label className="block text-lg mb-2 text-blue-300">
                                Target Configuration
                              </label>
                              <input
                                type="text"
                                value={nmapOptions.target}
                                onChange={(e) => setNmapOptions(prev => ({
                                  ...prev,
                                  target: e.target.value
                                }))}
                                className="w-full bg-gray-700 rounded-lg px-4 py-3 text-base"
                                placeholder="Enter IP/CIDR (e.g., 192.168.1.0/24)"
                              />
                            </div>

                            <div>
                              <label className="block text-lg mb-2 text-blue-300">
                                Scan Profile
                              </label>
                              <select
                                value={nmapOptions.scanType}
                                onChange={(e) => setNmapOptions(prev => ({
                                  ...prev,
                                  scanType: e.target.value
                                }))}
                                className="w-full bg-gray-700 rounded-lg px-4 py-3 text-base"
                              >
                                <option value="quick">🚀 Quick Scan</option>
                                <option value="full">🔍 Full Comprehensive Scan</option>
                                <option value="udp">🛡️ UDP Port Scan</option>
                                <option value="custom">⚙️ Custom Configuration</option>
                              </select>
                            </div>

                            {nmapOptions.scanType === "custom" && (
                              <div className="space-y-6">
                                <div>
                                  <label className="block text-lg mb-2 text-blue-300">
                                    Port Specification
                                  </label>
                                  <input
                                    type="text"
                                    value={nmapOptions.ports}
                                    onChange={(e) => setNmapOptions(prev => ({
                                      ...prev,
                                      ports: e.target.value
                                    }))}
                                    className="w-full bg-gray-700 rounded-lg px-4 py-3 text-base"
                                    placeholder="Example: 80,443,1000-2000,U:53"
                                  />
                                </div>

                                <div className="space-y-4">
                                  <label className="flex items-center gap-3 text-base">
                                    <input
                                      type="checkbox"
                                      checked={nmapOptions.osDetection}
                                      onChange={(e) => setNmapOptions(prev => ({
                                        ...prev,
                                        osDetection: e.target.checked
                                      }))}
                                      className="w-5 h-5 accent-blue-500"
                                    />
                                    🖥️ OS Fingerprinting Detection
                                  </label>

                                  <label className="flex items-center gap-3 text-base">
                                    <input
                                      type="checkbox"
                                      checked={nmapOptions.serviceVersion}
                                      onChange={(e) => setNmapOptions(prev => ({
                                        ...prev,
                                        serviceVersion: e.target.checked
                                      }))}
                                      className="w-5 h-5 accent-blue-500"
                                    />
                                    🔍 Service Version Detection
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Column - Results */}
                          <div className="bg-gray-700/30 rounded-xl p-4">
                            {scanResults ? (
                              <div className="h-full flex flex-col">
                                <div className="flex gap-3 mb-4">
                                  <button
                                    onClick={() => navigator.clipboard.writeText(scanResults.raw)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
                                  >
                                    📋 Copy Raw
                                  </button>
                                  <button
                                    onClick={() => processCommand(`echo "${scanResults.raw}" > scan_results.txt`)}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
                                  >
                                    💾 Save Results
                                  </button>
                                </div>
                                <div className="prose prose-invert max-w-none flex-1 overflow-y-auto">
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: scanResults.analyzed
                                        .replace(/\n/g, '<br />')
                                        .replace(/### (.*?)\n/g, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
                                        .replace(/- (.*?)\n/g, '<li>$1</li>')
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-gray-400">
                                {isScanning ? (
                                  <div className="text-center">
                                    <div className="animate-pulse text-4xl mb-4">🔍</div>
                                    <p className="text-xl">Scanning Network...</p>
                                    <p className="text-sm mt-2">This may take several minutes</p>
                                  </div>
                                ) : (
                                  "Scan results will appear here"
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer Controls */}
                      <div className="mt-6 pt-4 border-t border-blue-700">
                        <button
                          onClick={handleNmapScan}
                          disabled={isScanning || !nmapOptions.target}
                          className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-lg
                            ${isScanning ? "bg-blue-700 cursor-not-allowed" : 
                            "bg-blue-600 hover:bg-blue-500"} transition-all`}
                        >
                          {isScanning ? (
                            <>
                              <div className="animate-spin text-2xl">🌀</div>
                              Scanning in Progress...
                            </>
                          ) : (
                            <>
                              <Terminal size={24} />
                              Launch Network Scan
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // Regular Tool Card
                  <motion.div
                    key="card"
                    layoutId={`card-${tool.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <ToolCard
                      tool={tool}
                      onClick={() => {
                        if (tool.id === 1) {
                          setExpandedToolId(tool.id);
                        } else if (tool.action) {
                          tool.action();
                        }
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}