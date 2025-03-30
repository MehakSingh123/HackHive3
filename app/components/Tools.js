"use client";
import { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ToolCard from "./ToolCard";
import OsintTools from "./OsintTools";
import { Activity, Database, Lock, Shield, Terminal, Search } from "lucide-react";
import { VMContext } from "../contexts/VMContext";
import { TerminalContext } from "../contexts/TerminalContext";
import { CommandProcessorContext } from "../contexts/CommandProcessorContext";

export default function Tools() {
  const { vmStatus } = useContext(VMContext);
  const { addTerminalOutput, setTerminalVisible } = useContext(TerminalContext);
  const { processCommand } = useContext(CommandProcessorContext);

  const [expandedToolId, setExpandedToolId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [phishingOptions, setPhishingOptions] = useState({
    attackType: "login",
    template: "1",
    tunneler: "cloudflared",
    port: "8080",
    region: "eu",
    subdomain: "",
    redirectUrl: "",
    advanced: false,
    generatedUrls: [],
  });

  const [nmapOptions, setNmapOptions] = useState({
    target: "",
    scanType: "quick",
    ports: "",
    osDetection: false,
    serviceVersion: true,
  });

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
    {
      id: 5,
      name: "OSINT Tools",
      icon: <Search size={24} />,
      description: "Gather intelligence from open sources",
      enabled: vmStatus === "Started",
    },
    {
      id: 6,
      name: "Phishing Framework",
      icon: <Shield size={24} />,
      description: "Advanced phishing simulation toolkit",
      enabled: vmStatus === "Started",
    },
  ];

  const handleNmapScan = async () => {
    setIsScanning(true);
    try {
      const command = `nmap ${nmapOptions.target} ${nmapOptions.scanType === "custom" ? 
        `${nmapOptions.ports ? `-p ${nmapOptions.ports}` : ""} 
         ${nmapOptions.osDetection ? "-O" : ""} 
         ${nmapOptions.serviceVersion ? "-sV" : ""}` : 
        `${nmapOptions.scanType === "quick" ? "-T4 -F" : 
        nmapOptions.scanType === "full" ? "-p- -sV -O" : 
        nmapOptions.scanType === "udp" ? "-sU" : ""}`}`;

      addTerminalOutput("command", `root@vm:~# ${command}`);

      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });

      const data = await res.json();
      const rawOutput = data.output;

      const analysis = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Analyze these nmap results:\n${rawOutput}\nFormatted as markdown with: Summary, Open Ports table, Vulnerabilities (CVSS >7), and Recommendations.`
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

  const handlePhishingAttack = async () => {
    try {
      // Implement your phishing attack logic here
    } catch (error) {
      addTerminalOutput("error", `Phishing attack failed: ${error.message}`);
    }
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Security Assessment Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div key={tool.id} className="relative">
              <AnimatePresence>
                {expandedToolId === tool.id ? (
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
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-700">
                        <h3 className="text-2xl font-bold flex items-center gap-3">
                          {tool.id === 1 ? (
                            <>
                              <Activity size={28} className="text-blue-400" />
                              Network Mapper
                            </>
                          ) : (
                            <>
                              <Search size={28} className="text-blue-400" />
                              AI-Enhanced OSINT Investigation
                            </>
                          )}
                        </h3>
                        <button 
                          onClick={() => setExpandedToolId(null)}
                          className="text-gray-300 hover:text-white text-2xl p-2"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-4">
                        {tool.id === 1 ? (
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
                        ) : tool.id === 5 ? (
                          <OsintTools 
                            setTerminalVisible={setTerminalVisible}
                            addTerminalOutput={addTerminalOutput}
                            processCommand={processCommand}
                          />
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <ToolCard
                    tool={tool}
                    onClick={() => tool.enabled && setExpandedToolId(tool.id)}
                  />
                )}
              </AnimatePresence>
              {expandedToolId === 6 && (
                <motion.div
                  key="expanded-phishing"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="fixed inset-0 m-auto z-20 bg-gray-800 rounded-xl shadow-2xl p-6 border-2 border-red-500"
                  style={{
                    width: '75vw',
                    height: '75vh',
                    maxWidth: '1200px',
                    maxHeight: '800px'
                  }}
                >
                  <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-red-700">
                      <h3 className="text-2xl font-bold flex items-center gap-3">
                        <Shield size={28} className="text-red-400" />
                        Phishing Framework
                        <span className="text-sm text-red-300 ml-2">(Educational Use Only)</span>
                      </h3>
                      <button 
                        onClick={() => setExpandedToolId(null)}
                        className="text-gray-300 hover:text-white text-2xl p-2"
                      >
                        ×
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 flex-1">
                      {/* Configuration Column */}
                      <div className="space-y-6">
                        <div className="bg-gray-700/30 p-4 rounded-lg">
                          <h4 className="text-lg font-bold mb-4 text-red-300">Attack Configuration</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm mb-1">Attack Type</label>
                              <select
                                value={phishingOptions.attackType}
                                onChange={(e) => setPhishingOptions(p => ({...p, attackType: e.target.value}))}
                                className="w-full bg-gray-600 rounded p-2 text-sm"
                              >
                                <option value="login">🔐 Login Phishing</option>
                                <option value="image">🖼️ Image Capture</option>
                                <option value="video">🎥 Video Phishing</option>
                                <option value="location">📍 Location Grabber</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm mb-1">Template</label>
                              <select
                                value={phishingOptions.template}
                                onChange={(e) => setPhishingOptions(p => ({...p, template: e.target.value}))}
                                className="w-full bg-gray-600 rounded p-2 text-sm"
                              >
                                <option value="1">🔑 Default Login</option>
                                <option value="2">📧 Email Portal</option>
                                <option value="3">🔒 OTP Verification</option>
                                <option value="4">📱 Social Media</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm mb-1">Tunneling Service</label>
                              <div className="grid grid-cols-2 gap-2">
                                {['cloudflared', 'loclx', 'serveo'].map((service) => (
                                  <label key={service} className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      value={service}
                                      checked={phishingOptions.tunneler === service}
                                      onChange={() => setPhishingOptions(p => ({...p, tunneler: service}))}
                                      className="accent-red-500"
                                    />
                                    <span className="text-sm capitalize">{service}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="flex items-center justify-between">
                                <span className="text-sm">Advanced Options</span>
                                <button 
                                  onClick={() => setPhishingOptions(p => ({...p, advanced: !p.advanced}))}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  {phishingOptions.advanced ? '▲ Hide' : '▼ Show'}
                                </button>
                              </label>
                              
                              {phishingOptions.advanced && (
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    placeholder="Custom Subdomain"
                                    value={phishingOptions.subdomain}
                                    onChange={(e) => setPhishingOptions(p => ({...p, subdomain: e.target.value}))}
                                    className="w-full bg-gray-600 rounded p-2 text-sm"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Redirect URL"
                                    value={phishingOptions.redirectUrl}
                                    onChange={(e) => setPhishingOptions(p => ({...p, redirectUrl: e.target.value}))}
                                    className="w-full bg-gray-600 rounded p-2 text-sm"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Port (default: 8080)"
                                    value={phishingOptions.port}
                                    onChange={(e) => setPhishingOptions(p => ({...p, port: e.target.value}))}
                                    className="w-full bg-gray-600 rounded p-2 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handlePhishingAttack}
                          disabled={isScanning}
                          className="w-full bg-red-600 hover:bg-red-500 rounded-lg py-3 font-medium flex items-center justify-center gap-2"
                        >
                          {isScanning ? (
                            <>
                              <div className="animate-spin">🌀</div>
                              Launching Attack...
                            </>
                          ) : (
                            '🚀 Start Phishing Simulation'
                          )}
                        </button>
                      </div>

                      {/* Results Column */}
                      <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h4 className="text-lg font-bold mb-4 text-red-300">Attack Dashboard</h4>
                        
                        {phishingOptions.generatedUrls.length > 0 ? (
                          <div className="space-y-4">
                            <div className="p-3 bg-gray-800 rounded">
                              <div className="flex justify-between items-center mb-2 pb-2 border-b border-red-700">
                                <span className="text-sm font-mono">Active Connections</span>
                                <span className="text-xs text-green-400">● Live</span>
                              </div>
                              <div className="space-y-2">
                                {phishingOptions.generatedUrls.map((url, index) => (
                                  <div key={index} className="group relative">
                                    <div className="flex items-center justify-between p-2 bg-gray-700 rounded hover:bg-gray-600">
                                      <span className="text-sm truncate">{url}</span>
                                      <button
                                        onClick={() => navigator.clipboard.writeText(url)}
                                        className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs bg-gray-500 rounded hover:bg-gray-400"
                                      >
                                        Copy
                                      </button>
                                    </div>
                                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 p-2 rounded text-xs">
                                      Click to copy URL
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="p-3 bg-gray-800 rounded">
                              <h5 className="text-sm font-bold mb-2">Captured Data</h5>
                              <div className="h-32 overflow-y-auto text-xs space-y-1">
                                {/* Add captured data display logic here */}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            {isScanning ? (
                              <div className="text-center animate-pulse">
                                <div className="text-4xl mb-2">🕵️♂️</div>
                                <p>Preparing phishing environment...</p>
                                <p className="text-xs mt-1">This may take 10-15 seconds</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="text-4xl mb-2">🔒</div>
                                <p>No active phishing session</p>
                                <p className="text-xs mt-1">Generated URLs will appear here</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
