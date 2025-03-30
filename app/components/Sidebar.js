// components/Sidebar.js
"use client";
import { Server, Shield, Activity, Database, Terminal, Home, Settings, HelpCircle } from "lucide-react";
import { useContext, useEffect } from "react";
import { VMContext } from "../contexts/VMContext";

export default function Sidebar() {
  const { vmStatus, startVM, stopVM } = useContext(VMContext);

  return (
    <aside className="w-72 bg-[#081A2C] p-4 flex flex-col shadow-lg border-r border-[#00ADEE]/30">
      <div className="flex items-center justify-center mb-6 mt-2">
        <Shield size={28} className="text-[#00ADEE] mr-2" />
        <h2 className="text-xl font-bold text-white">Security Console</h2>
      </div>
      
      <div className="p-4 mb-6 bg-[#0A2540] rounded-lg border border-[#00ADEE]/30 shadow-inner">
        <h3 className="text-[#00ADEE] font-medium mb-3 text-sm uppercase tracking-wider">Virtual Machine</h3>
        {vmStatus === "Started" ? (
          <button
            onClick={stopVM}
            className="w-full mb-4 py-2.5 px-4 rounded-md font-medium transition-all bg-red-700 hover:bg-red-600 active:scale-95 flex items-center justify-center text-white"
          >
            <span className="mr-2">●</span> Stop VM
          </button>
        ) : (
          <button
            onClick={startVM}
            className="w-full mb-4 py-2.5 px-4 rounded-md font-medium transition-all bg-[#00ADEE] hover:bg-[#0090C5] active:scale-95 flex items-center justify-center text-white"
          >
            <span className="mr-2">●</span> Start VM
          </button>
        )}
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">Status:</span>
          <span
            className={`px-2 py-1 rounded-md text-sm ${
              vmStatus === "Started"
                ? "bg-[#00ADEE]/20 text-[#00ADEE] border border-[#00ADEE]/40"
                : vmStatus === "Starting..." || vmStatus === "Stopping..."
                ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/40"
                : vmStatus.startsWith("Error")
                ? "bg-red-600/20 text-red-400 border border-red-600/40"
                : "bg-gray-600/20 text-gray-400 border border-gray-600/40"
            }`}
          >
            {vmStatus}
          </span>
        </div>
      </div>
      
      <nav className="mb-6">
        <h3 className="text-[#00ADEE] font-medium mb-3 text-sm uppercase tracking-wider px-2">Navigation</h3>
        <ul className="space-y-1">
          <li>
            <a href="/" className="flex items-center py-2.5 px-3 rounded-md text-white hover:bg-[#0A2540] transition-colors">
              <Home size={18} className="mr-3 text-gray-400" />
              Dashboard
            </a>
          </li>
          <li>
            <a href="/tools" className="flex items-center py-2.5 px-3 rounded-md text-white hover:bg-[#0A2540] transition-colors">
              <Activity size={18} className="mr-3 text-gray-400" />
              Security Tools
            </a>
          </li>
          <li>
            <a href="/terminal" className="flex items-center py-2.5 px-3 rounded-md text-white hover:bg-[#0A2540] transition-colors">
              <Terminal size={18} className="mr-3 text-gray-400" />
              Terminal
            </a>
          </li>
          <li>
            <a href="/settings" className="flex items-center py-2.5 px-3 rounded-md text-white hover:bg-[#0A2540] transition-colors">
              <Settings size={18} className="mr-3 text-gray-400" />
              Settings
            </a>
          </li>
          <li>
            <a href="/help" className="flex items-center py-2.5 px-3 rounded-md text-white hover:bg-[#0A2540] transition-colors">
              <HelpCircle size={18} className="mr-3 text-gray-400" />
              Documentation
            </a>
          </li>
        </ul>
      </nav>
      
      <div className="mt-auto border-t border-[#00ADEE]/20 pt-4 text-xs text-gray-400">
        <p className="flex items-center gap-1">
          <span className="h-2 w-2 bg-[#00ADEE] rounded-full inline-block"></span> VM Integration v1.2.0
        </p>
        <p>© {new Date().getFullYear()} HackHive Security Suite</p>
      </div>
    </aside>
  );
}