"use client";
import { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ToolCard from "./ToolCard";
import { VMContext } from "../contexts/VMContext";
import { TerminalContext } from "../contexts/TerminalContext";
import DynamicToolForm from "./DynamicTools";
import { toolsConfig } from "@/public/toolsConfig";

export default function Tools() {
  const { vmStatus } = useContext(VMContext);
  const [expandedToolId, setExpandedToolId] = useState(null);

  // Extract and group tools dynamically
  const groupedTools = Object.values(toolsConfig.groups).map((group) => ({
    ...group,
    tools: Object.values(group.tools).map((tool) => ({
      ...tool,
      enabled: vmStatus=="Started"? true : false,
    })),
  }));
  

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      {groupedTools.map((group) => (
        <div key={group.name} className="mb-6">
          {/* Group Name as Section Heading */}
          <h2 className="text-2xl font-bold mb-4">{group.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.tools.map((tool) => (
              <div key={tool.id} className="relative">
                <AnimatePresence>
                  {expandedToolId === tool.id ? (
                    <motion.div
                      key="expanded"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="fixed inset-0 m-auto z-20 bg-gray-800 rounded-xl shadow-2xl p-6 border-2 border-blue-500"
                      style={{
                        width: "75vw",
                        height: "75vh",
                        maxWidth: "1200px",
                        maxHeight: "800px",
                      }}
                    >
                      {tool.config ? (
                        <DynamicToolForm
                          toolConfig={tool}
                          onClose={() => setExpandedToolId(null)}
                        />
                      ) : null}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="card"
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
                          if (tool.config) {
                            setExpandedToolId(tool.id);
                          } else if (tool.action) {
                            tool.action();
                          }
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
