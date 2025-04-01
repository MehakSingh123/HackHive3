// components/Tools.js
"use client";
import { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ToolCard from "./ToolCard";
import { VMContext } from "../contexts/VMContext";
// Make sure the import name matches the actual filename
import DynamicToolForm from "./DynamicTools"; // Assuming filename is DynamicToolForm.js
import { toolsConfig } from "@/public/toolsConfig"; // Assuming this path is correct

export default function Tools() {
  const { vmStatus } = useContext(VMContext);
  const [expandedToolId, setExpandedToolId] = useState(null);

  // Find the tool data based on expandedToolId
  const expandedToolData = expandedToolId
    ? Object.values(toolsConfig.groups)
        .flatMap((group) => Object.values(group.tools))
        .find((tool) => tool.id === expandedToolId)
    : null;

  // Enhance tools with enabled status based on vmStatus
  const groupedTools = Object.values(toolsConfig.groups).map((group) => ({
    ...group,
    tools: Object.values(group.tools).map((tool) => ({
      ...tool,
      enabled: vmStatus === "Started" ? true : false, // Simplified logic
    })),
  }));

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      {groupedTools.map((group) => (
        <div key={group.name} className="mb-8"> {/* Increased margin */}
          <h2 className="text-3xl font-bold mb-5 text-[#00ADEE]"> {/* Styled group name */}
            {group.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Added lg breakpoint */}
            {group.tools.map((tool) => (
              <motion.div
                key={tool.id}
                layoutId={`card-${tool.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                className={`${
                  !tool.enabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <ToolCard
                  tool={tool}
                  onClick={() => {
                    if (!tool.enabled) return;
                    // We only need to set the ID here, the modal logic is below
                    setExpandedToolId(tool.id);
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal and Backdrop Logic */}
      <AnimatePresence>
        {expandedToolId && expandedToolData && (
          <>
            {/* Backdrop with Blur */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10" // z-10 is below modal (z-20) but above page content
              onClick={() => setExpandedToolId(null)} // Close modal on backdrop click
            />

            {/* Expanded Tool Modal */}
            <motion.div
              key="expanded-tool"
              layoutId={`card-${expandedToolId}`} // Ensure this matches the card's layoutId
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 m-auto z-20 bg-gray-800 rounded-xl shadow-2xl p-6 border-2 border-[#00ADEE]/70 overflow-hidden" // Added overflow-hidden
              style={{
                // Increased size
                width: "85vw",
                height: "85vh",
                maxWidth: "1400px", // Increased max width
                maxHeight: "900px", // Increased max height
              }}
            >
              {/* Render the form inside the expanded modal */}
              <DynamicToolForm
                toolConfig={expandedToolData}
                onClose={() => setExpandedToolId(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}