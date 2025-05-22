// components/Sidebar.js
"use client";

import { Server, Shield, Activity, Bot,
        Home, Settings, HelpCircle, BookOpen,
        Target, RefreshCw } from "lucide-react";
import { useContext, useState } from "react";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { VMContext } from "../contexts/VMContext";

export default function Sidebar() {
  const { vmStatus, startVM, stopVM, isActionInProgress } = useContext(VMContext);
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);

  // Function to determine if a link is active
  const isActive = (href) => pathname === href;

  // Display a tooltip briefly when hovering over the status indicator
  const handleStatusHover = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000); // Hide after 3 seconds
  };

  // Get status color based on vmStatus
  const getStatusColorClass = () => {
    switch(vmStatus) {
      case "Started":
        return "bg-[#00ADEE]/20 text-[#00ADEE] border border-[#00ADEE]/40";
      case "Starting...":
      case "Stopping...":
        return "bg-yellow-600/20 text-yellow-400 border border-yellow-600/40";
      case "Loading...":
        return "bg-blue-600/20 text-blue-400 border border-blue-600/40";
      case "Stopped":
        return "bg-orange-600/20 text-orange-400 border border-orange-600/40";
      default:
        return vmStatus.startsWith("Error")
          ? "bg-red-600/20 text-red-400 border border-red-600/40"
          : "bg-gray-600/20 text-gray-400 border border-gray-600/40";
    }
  };

  return (
    <aside className="w-72 bg-[#081A2C] p-4 flex flex-col shadow-lg border-r border-[#00ADEE]/30">
      <div className="flex items-center justify-center mb-6 mt-2">
        <Shield size={28} className="text-[#00ADEE] mr-2" />
        <h2 className="text-xl font-bold text-white">Security Console</h2>
      </div>

      {/* VM Control Section - Enhanced with better status handling */}
      <div className="p-4 mb-6 bg-[#0A2540] rounded-lg border border-[#00ADEE]/30 shadow-inner relative">
        <h3 className="text-[#00ADEE] font-medium mb-3 text-sm uppercase tracking-wider">Virtual Machine</h3>
        
        {vmStatus === "Started" ? (
          <button
            onClick={stopVM}
            disabled={isActionInProgress}
            className={`w-full mb-4 py-2.5 px-4 rounded-md font-medium transition-all 
              ${isActionInProgress 
                ? 'bg-gray-700 text-gray-300 cursor-not-allowed' 
                : 'bg-red-700 hover:bg-red-600 active:scale-95 text-white'}`}
          >
            <span className={`mr-2 inline-block w-2 h-2 rounded-full ${isActionInProgress ? 'bg-yellow-400 animate-pulse' : 'bg-red-300'}`}></span>
            {isActionInProgress ? 'Working...' : 'Stop VM'}
          </button>
        ) : (
          <button
            onClick={startVM}
            disabled={isActionInProgress || vmStatus === "Starting..."}
            className={`w-full mb-4 py-2.5 px-4 rounded-md font-medium transition-all 
              ${isActionInProgress || vmStatus === "Starting..." 
                ? 'bg-gray-700 text-gray-300 cursor-not-allowed' 
                : 'bg-[#00ADEE] hover:bg-[#0090C5] active:scale-95 text-white'}`}
          >
            <span className={`mr-2 inline-block w-2 h-2 rounded-full ${isActionInProgress || vmStatus === "Starting..." ? 'bg-yellow-400 animate-pulse' : 'bg-green-300'}`}></span>
            {isActionInProgress || vmStatus === "Starting..." ? 'Working...' : 'Start VM'}
          </button>
        )}
        
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">Status:</span>
          <div className="relative">
            <span
              className={`px-2 py-1 rounded-md text-sm ${getStatusColorClass()}`}
              onMouseEnter={handleStatusHover}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {vmStatus}
              {vmStatus === "Starting..." || vmStatus === "Stopping..." || vmStatus === "Loading..." ? (
                <RefreshCw size={12} className="ml-1 inline-block animate-spin" />
              ) : null}
            </span>
            
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#0A2540] text-white text-xs rounded border border-[#00ADEE]/40 shadow-lg z-10 w-48">
                <p className="text-center">
                  {vmStatus === "Started" && "The VM is running and ready for use."}
                  {vmStatus === "Starting..." && "The VM is currently starting up. Please wait..."}
                  {vmStatus === "Stopping..." && "The VM is shutting down. Please wait..."}
                  {vmStatus === "Stopped" && "The VM is stopped but ready to be started."}
                  {vmStatus === "Not Started" && "The VM has not been started yet."}
                  {vmStatus === "Loading..." && "Checking VM status..."}
                  {vmStatus.startsWith("Error") && "There was an error with the VM. Try restarting."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Section - Unchanged */}
      <nav className="mb-6 flex-1 overflow-y-auto">
        <h3 className="text-[#00ADEE] font-medium mb-3 text-sm uppercase tracking-wider px-2">Navigation</h3>
        <ul className="space-y-1">
          <li>
            <Link href="/" className={`flex items-center py-2.5 px-3 rounded-md transition-colors ${isActive('/') ? 'bg-[#0A2540] text-[#00ADEE]' : 'text-white hover:bg-[#0A2540]/50 hover:text-blue-100'}`}>
              <Home size={18} className={`mr-3 ${isActive('/') ? 'text-[#00ADEE]' : 'text-gray-400'}`} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/tools" className={`flex items-center py-2.5 px-3 rounded-md transition-colors ${isActive('/tools') ? 'bg-[#0A2540] text-[#00ADEE]' : 'text-white hover:bg-[#0A2540]/50 hover:text-blue-100'}`}>
              <Activity size={18} className={`mr-3 ${isActive('/tools') ? 'text-[#00ADEE]' : 'text-gray-400'}`} />
              Security Tools
            </Link>
          </li>
          <li>
            <Link href="/ai" className={`flex items-center py-2.5 px-3 rounded-md transition-colors ${isActive('/ai') ? 'bg-[#0A2540] text-[#00ADEE]' : 'text-white hover:bg-[#0A2540]/50 hover:text-blue-100'}`}>
              <Bot size={18} className={`mr-3 ${isActive('/ai') ? 'text-[#00ADEE]' : 'text-gray-400'}`} />
              AI Assistant
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}