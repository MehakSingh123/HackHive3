// components/ToolCard.js
"use client";
import { motion } from "framer-motion";

export default function ToolCard({ tool, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-gray-800 p-5 rounded-lg shadow-lg border-l-4 ${
        tool.enabled ? "border-green-500" : "border-gray-600"
      } transition-all cursor-pointer`}
      onClick={tool.enabled ? onClick : undefined}
    >
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-md ${tool.enabled ? "bg-green-900/40" : "bg-gray-700"} mr-3`}>
          {tool.icon}
        </div>
        <h3 className="text-lg font-medium">{tool.name}</h3>
      </div>
      <p className="text-gray-400 mb-4 text-sm">{tool.description}</p>
      <div className={`w-full py-2 px-4 rounded-md font-medium transition-all ${
        tool.enabled 
          ? "bg-blue-600 hover:bg-blue-500 active:scale-95" 
          : "bg-gray-700 cursor-not-allowed text-gray-400"
      }`}>
        {tool.enabled ? "Open Tool" : "Start VM to Enable"}
      </div>
    </motion.div>
  );
}