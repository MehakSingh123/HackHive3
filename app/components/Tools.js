"use client";
import { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppIcon from "./AppIcon"; // Use the new AppIcon component
import { VMContext } from "../contexts/VMContext";
import DynamicToolForm from "./DynamicTools";
import { toolsConfig } from "@/public/toolsConfig";
import { X } from "lucide-react"; // For the close button

export default function Tools() {
  const { vmStatus } = useContext(VMContext);
  const [expandedToolId, setExpandedToolId] = useState(null);

  // Find the tool data based on expandedToolId (same logic)
  const expandedToolData = expandedToolId
    ? Object.values(toolsConfig.groups)
        .flatMap((group) => Object.values(group.tools))
        .find((tool) => tool.id === expandedToolId)
    : null;

  // Enhance tools with enabled status based on vmStatus (same logic)
  const groupedTools = Object.values(toolsConfig.groups).map((group) => ({
    ...group,
    tools: Object.values(group.tools).map((tool) => ({
      ...tool,
      enabled: vmStatus === "Started", // Simplified: only enabled if VM is exactly "Started"
    })),
  }));

  return (
    // This component now assumes it's rendered within LinuxDesktopLayout
    // No <main> tag here needed if LinuxDesktopLayout provides it
    <>
      {groupedTools.map((group) => (
        <div key={group.name} className="mb-10">
          {/* Group Title - Linux Folder Style */}
           <h2 className="text-xl font-semibold mb-5 text-[#00ADEE]/90 border-b-2 border-[#00ADEE]/20 pb-2">
             {group.name}
           </h2>
          {/* Grid for App Icons */}
           <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-4 gap-y-6">
             {group.tools.map((tool) => (
               <motion.div
                 key={tool.id}
                 layoutId={`card-${tool.id}`} // This links the icon to the modal
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.8 }}
                 transition={{ type: "spring", stiffness: 300, damping: 30 }}
                 // No specific class needed here unless for positioning/layout
               >
                 <AppIcon
                   tool={tool}
                   onClick={() => {
                     if (!tool.enabled) return;
                     setExpandedToolId(tool.id);
                   }}
                 />
               </motion.div>
             ))}
           </div>
        </div>
      ))}

      {/* Modal - Styled as a Window */}
      <AnimatePresence>
        {expandedToolId && expandedToolData && (
          <>
            {/* Backdrop with Blur */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" // Higher z-index
              onClick={() => setExpandedToolId(null)} // Close on backdrop click
            />

            {/* Window Modal */}
            <motion.div
              key="expanded-tool-window"
              layoutId={`card-${expandedToolId}`} // Matches the AppIcon's parent div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="fixed inset-0 m-auto z-50 flex flex-col bg-gray-900/70 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl overflow-hidden"
              style={{
                // Adjust size as needed, maybe make it slightly smaller than before
                width: "clamp(300px, 80vw, 1200px)",
                height: "clamp(400px, 80vh, 800px)",
              }}
            >
              {/* Window Title Bar */}
              <motion.div className="h-10 bg-gradient-to-b from-gray-800/80 to-gray-900/70 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
                 <div className="flex items-center space-x-2 text-[#00ADEE]">
                   <span className="text-lg">{expandedToolData.icon}</span>
                   <h3 className="font-medium text-sm text-white/90">{expandedToolData.name}</h3>
                 </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90, backgroundColor: 'rgba(255,0,0,0.7)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setExpandedToolId(null)}
                  className="p-1 rounded-full text-gray-300 hover:text-white transition-colors"
                  title="Close"
                >
                  <X size={16} />
                </motion.button>
              </motion.div>

              {/* Window Content Area (Scrollable) */}
              <div className="flex-1 p-6 overflow-y-auto">
                <DynamicToolForm
                  toolConfig={expandedToolData}
                  onClose={() => setExpandedToolId(null)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
