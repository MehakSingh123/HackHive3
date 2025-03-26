// components/MainContent.js
"use client";
import { useContext } from "react";
import ToolCard from "./ToolCard";
import { Activity, Database, Lock, Shield, Zap } from "lucide-react";
import { VMContext } from "../contexts/VMContext";
import { TerminalContext } from "../contexts/TerminalContext";

export default function Tools() {
  // Tools can be defined locally or imported from a constants file.
  const { vmStatus } = useContext(VMContext);
  const { addTerminalOutput } = useContext(TerminalContext);

  const tools = [
    {
      id: 1,
      name: "Network Mapper",
      icon: <Activity size={24} />,
      description: "Scan networks and discover hosts and services",
      action: () => addTerminalOutput("system", "Network mapping initiated"),
      buttonText: "Run Network Mapper",
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
      action: () =>
        addTerminalOutput("system", "Password cracking module loaded"),
      buttonText: "Launch Tool",
      enabled: vmStatus === "Started",
    },
    {
      id: 4,
      name: "Database Explorer",
      icon: <Database size={24} />,
      description: "Examine database structures and vulnerabilities",
      action: () =>
        addTerminalOutput("system", "Database explorer initialized"),
      buttonText: "Open Explorer",
      enabled: vmStatus === "Started",
    },
  ];

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Penetration Testing Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </main>
  );
}
