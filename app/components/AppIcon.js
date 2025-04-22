// components/AppIcon.js
"use client";
import { motion } from "framer-motion";

export default function AppIcon({ tool, onClick }) {
  return (
    <motion.div
      layout // Keep layout for potential future use, though layoutId is on the parent in Tools.js
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.95 }}
      className={`flex flex-col items-center p-3 rounded-lg transition-all cursor-pointer relative group ${
         !tool.enabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white/5"
      }`}
      onClick={tool.enabled ? onClick : undefined}
      style={{ width: '100px' }} // Fixed width for icon grid consistency
      title={tool.enabled ? tool.name : `${tool.name} (VM Required)`}
    >
      {/* Icon Background and Icon */}
      <div className={`relative p-4 rounded-xl mb-2 transition-colors duration-200 ${
          tool.enabled ? "bg-gradient-to-br from-[#0A2540] to-[#0c2c4d] shadow-md group-hover:shadow-lg" : "bg-gray-700/50"
      }`}>
        <div className={`absolute inset-0 opacity-[0.04] bg-[radial-gradient(#00ADEE_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none rounded-xl`}></div>
         <div className={`text-3xl ${tool.enabled ? 'text-[#00ADEE]' : 'text-gray-500'}`}>
           {tool.icon}
         </div>
          {/* Enabled/Disabled Indicator Dot */}
         <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-black/20 ${
             tool.enabled ? 'bg-green-500' : 'bg-red-600'
         }`}></div>
      </div>

      {/* Tool Name */}
      <p className="text-xs text-center text-white/90 truncate w-full px-1">
        {tool.name}
      </p>

       {/* Optional: Show "OFFLINE" badge subtly */}
       {/* {!tool.enabled && (
          <span className="absolute top-1 left-1 bg-gray-800/70 text-gray-400 text-[8px] px-1 py-0 rounded border border-gray-600">
            OFF
          </span>
       )} */}
    </motion.div>
  );
}