// components/Sidebar.js
"use client";

import { Server, Shield, Activity, Bot, // Changed Terminal to Bot
        Home, Settings, HelpCircle, BookOpen // Added BookOpen for Docs
      } from "lucide-react";
import { useContext } from "react"; // Removed useEffect as it wasn't used
import { usePathname } from 'next/navigation'; // Import usePathname
import Link from 'next/link'; // Import Link
import { VMContext } from "../contexts/VMContext";
import { /*...,*/ Target } from "lucide-react"; // Add Target or another suitable icon

export default function Sidebar() {
  const { vmStatus, startVM, stopVM } = useContext(VMContext);
  const pathname = usePathname(); // Get current path

  // Function to determine if a link is active
  const isActive = (href) => pathname === href;

  return (
    <aside className="w-72 bg-[#081A2C] p-4 flex flex-col shadow-lg border-r border-[#00ADEE]/30">
      <div className="flex items-center justify-center mb-6 mt-2">
        <Shield size={28} className="text-[#00ADEE] mr-2" />
        <h2 className="text-xl font-bold text-white">Security Console</h2>
      </div>

      {/* VM Control Section - Remains the same */}
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

      {/* Navigation Section - Updated with Link */}
      <nav className="mb-6 flex-1 overflow-y-auto"> {/* Added flex-1 and overflow */}
        <h3 className="text-[#00ADEE] font-medium mb-3 text-sm uppercase tracking-wider px-2">Navigation</h3>
        <ul className="space-y-1">
          <li>
             {/* Use Link component */}
            <Link href="/" className={`flex items-center py-2.5 px-3 rounded-md transition-colors ${isActive('/') ? 'bg-[#0A2540] text-[#00ADEE]' : 'text-white hover:bg-[#0A2540]/50 hover:text-blue-100'}`}>
              <Home size={18} className={`mr-3 ${isActive('/') ? 'text-[#00ADEE]' : 'text-gray-400'}`} />
              Dashboard
            </Link>
          </li>
          <li>
             {/* Use Link component */}
            <Link href="/tools" className={`flex items-center py-2.5 px-3 rounded-md transition-colors ${isActive('/tools') ? 'bg-[#0A2540] text-[#00ADEE]' : 'text-white hover:bg-[#0A2540]/50 hover:text-blue-100'}`}>
              <Activity size={18} className={`mr-3 ${isActive('/tools') ? 'text-[#00ADEE]' : 'text-gray-400'}`} />
              Security Tools
            </Link>
          </li>
          <li>
             {/* Changed to AI Assistant */}
            <Link href="/ai" className={`flex items-center py-2.5 px-3 rounded-md transition-colors ${isActive('/ai') ? 'bg-[#0A2540] text-[#00ADEE]' : 'text-white hover:bg-[#0A2540]/50 hover:text-blue-100'}`}>
              <Bot size={18} className={`mr-3 ${isActive('/ai') ? 'text-[#00ADEE]' : 'text-gray-400'}`} />
              AI Assistant
            </Link>
          </li>
          <li>
             {/* Use Link component */}
            <Link href="/settings" className={`flex items-center py-2.5 px-3 rounded-md transition-colors ${isActive('/settings') ? 'bg-[#0A2540] text-[#00ADEE]' : 'text-white hover:bg-[#0A2540]/50 hover:text-blue-100'}`}>
              <Settings size={18} className={`mr-3 ${isActive('/settings') ? 'text-[#00ADEE]' : 'text-gray-400'}`} />
              Settings
            </Link>
          </li>
          <li>
             {/* Use Link component */}
             {/* Changed icon for Documentation */}
            <Link href="/docs" className={`flex items-center py-2.5 px-3 rounded-md transition-colors ${isActive('/docs') ? 'bg-[#0A2540] text-[#00ADEE]' : 'text-white hover:bg-[#0A2540]/50 hover:text-blue-100'}`}>
              <BookOpen size={18} className={`mr-3 ${isActive('/docs') ? 'text-[#00ADEE]' : 'text-gray-400'}`} />
              Documentation
            </Link>
          </li>
          <li>
            <Link href="/challenges" className={`flex items-center py-2.5 px-3 rounded-md transition-colors ${isActive('/challenges') ? 'bg-[#0A2540] text-[#00ADEE]' : 'text-white hover:bg-[#0A2540]/50 hover:text-blue-100'}`}>
              <Target size={18} className={`mr-3 ${isActive('/challenges') ? 'text-[#00ADEE]' : 'text-gray-400'}`} />
              Challenge Labs
            </Link>
          </li>
        </ul>
      </nav>

      {/* Footer Section - Remains the same */}
      <div className="mt-auto border-t border-[#00ADEE]/20 pt-4 text-xs text-gray-400 flex-shrink-0">
        <p className="flex items-center gap-1">
          <span className="h-2 w-2 bg-[#00ADEE] rounded-full inline-block"></span> VM Integration v1.2.0
        </p>
        <p>© {new Date().getFullYear()} HackHive Security Suite</p>
      </div>
    </aside>
  );
}