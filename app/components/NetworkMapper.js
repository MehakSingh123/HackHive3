// components/NetworkMapper.js
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useNmap } from "../contexts/NmapContext";
import { useTerminalContext } from "../contexts/TerminalContext";
import { useAIChat } from "../contexts/AIChatContext";
import { Target, Scan, List, Zap } from "lucide-react";

export default function NetworkMapper() {
  const { 
    nmapVisible, 
    setNmapVisible,
    nmapOptions,
    setNmapOptions,
    scanResults,
    setScanResults,
    isScanning,
    setIsScanning
  } = useNmap();
  
  const { addTerminalOutput, processCommand } = useTerminalContext();
  const { addMessage } = useAIChat();

  const scanTypes = [
    { id: "quick", name: "Quick Scan", command: "-T4 -F" },
    { id: "full", name: "Full Scan", command: "-p- -sV -O" },
    { id: "udp", name: "UDP Scan", command: "-sU" },
    { id: "custom", name: "Custom Scan" },
  ];

  const handleScan = async () => {
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
    
    // Show command in terminal
    addTerminalOutput("command", `root@vm:~# ${command}`);
  
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      
      const data = await res.json();
      const rawOutput = data.output;
      
      // Send raw output to terminal
      rawOutput.split('\n').forEach(line => {
        addTerminalOutput("output", line);
      });
  
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
      const errorMessage = `Scan failed: ${error.message}`;
      errorMessage.split('\n').forEach(line => {
        addTerminalOutput("error", line);
      });
      setScanResults(null);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <AnimatePresence>
      {!nmapVisible ? (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={() => setNmapVisible(true)}
          className="fixed bottom-6 left-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-lg shadow-lg z-30 flex items-center gap-2"
        >
          <Zap size={20} />
          Run Network Mapper
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-6 left-6 w-96 bg-gray-800 rounded-lg shadow-xl z-40 border border-blue-500"
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target size={18} /> Network Scanner
              </h3>
              <button 
                onClick={() => setNmapVisible(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Target (IP/CIDR)</label>
                <input
                  type="text"
                  value={nmapOptions.target}
                  onChange={(e) => setNmapOptions(prev => ({
                    ...prev,
                    target: e.target.value
                  }))}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
                  placeholder="e.g., 192.168.1.0/24"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Scan Type</label>
                <select
                  value={nmapOptions.scanType}
                  onChange={(e) => setNmapOptions(prev => ({
                    ...prev,
                    scanType: e.target.value
                  }))}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
                >
                  {scanTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {nmapOptions.scanType === "custom" && (
                <>
                  <div>
                    <label className="block text-sm mb-1">Ports</label>
                    <input
                      type="text"
                      value={nmapOptions.ports}
                      onChange={(e) => setNmapOptions(prev => ({
                        ...prev,
                        ports: e.target.value
                      }))}
                      className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
                      placeholder="e.g., 80,443,1000-2000"
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={nmapOptions.osDetection}
                        onChange={(e) => setNmapOptions(prev => ({
                          ...prev,
                          osDetection: e.target.checked
                        }))}
                      />
                      OS Detection
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={nmapOptions.serviceVersion}
                        onChange={(e) => setNmapOptions(prev => ({
                          ...prev,
                          serviceVersion: e.target.checked
                        }))}
                      />
                      Service Versions
                    </label>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleScan}
              disabled={isScanning || !nmapOptions.target}
              className={`w-full mt-4 py-2 rounded-lg flex items-center justify-center gap-2
                ${isScanning ? "bg-blue-700 cursor-not-allowed" : 
                "bg-blue-600 hover:bg-blue-500"}`}
            >
              {isScanning ? (
                <>
                  <div className="animate-spin">🌀</div>
                  Scanning...
                </>
              ) : (
                <>
                  <Scan size={16} />
                  Start Scan
                </>
              )}
            </button>

            {scanResults && (
              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <div className="flex gap-2 mb-2">
                  <button 
                    className="text-xs bg-gray-600 px-2 py-1 rounded"
                    onClick={() => navigator.clipboard.writeText(scanResults.raw)}
                  >
                    Copy Raw
                  </button>
                  <button
                    className="text-xs bg-gray-600 px-2 py-1 rounded"
                    onClick={() => addMessage(`Analyze: ${scanResults.raw}`)}
                  >
                    Ask AI
                  </button>
                </div>
                <div className="text-sm whitespace-pre-wrap overflow-x-auto">
                  {scanResults.analyzed}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}