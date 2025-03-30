// components/ToolCard.js
"use client";
import { motion } from "framer-motion";

export default function ToolCard({ tool, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-[#0A2540] p-5 rounded-lg shadow-lg border ${
        tool.enabled ? "border-[#00ADEE]/50" : "border-gray-700"
      } transition-all cursor-pointer relative overflow-hidden`}
      onClick={tool.enabled ? onClick : undefined}
    >
      {/* Background pattern similar to Kali Linux pattern, using a pseudo-element */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#00ADEE_1px,transparent_1px)] [background-size:10px_10px] pointer-events-none"></div>
      
      <div className="flex items-center mb-4">
        <div className={`p-2.5 rounded-md ${
          tool.enabled ? "bg-[#00ADEE]/10 text-[#00ADEE]" : "bg-gray-700/50 text-gray-500"
        } mr-3`}>
          {tool.icon}
        </div>
        <h3 className="text-lg font-medium text-white">{tool.name}</h3>
      </div>
      <p className="text-gray-400 mb-4 text-sm">{tool.description}</p>
      <div className={`w-full py-2 px-4 rounded-md font-medium transition-all text-center ${
        tool.enabled 
          ? "bg-[#00ADEE] hover:bg-[#0090C5] text-white active:scale-95" 
          : "bg-gray-700/50 cursor-not-allowed text-gray-400 border border-gray-700"
      }`}>
        {tool.enabled ? "Launch Tool" : "VM Required"}
      </div>
      
      {!tool.enabled && (
        <div className="absolute top-3 right-3">
          <span className="bg-gray-700/70 text-gray-400 text-xs px-2 py-0.5 rounded border border-gray-600">
            OFFLINE
          </span>
        </div>
      )}
    </motion.div>
  );
}