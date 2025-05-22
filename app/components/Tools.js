"use client";
import { useContext, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { VMContext } from "../contexts/VMContext";
import { useWindowManager } from "../contexts/WindowManagerContext";
import { toolsConfig } from "@/public/toolsConfig";
import { Search, Info, X } from "lucide-react";

// Separate AppIcon component for better code organization
const AppIcon = ({ tool, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const iconBgColor = tool.iconBgColor || "#1e293b";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`relative ${!tool.enabled ? "opacity-60" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        disabled={!tool.enabled}
        className={`w-full aspect-square bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden flex flex-col items-center justify-center text-center p-4 relative transition-all duration-200 ${
          tool.enabled
            ? "hover:bg-[#00ADEE]/10 hover:border-[#00ADEE]/30 hover:shadow-lg hover:shadow-[#00ADEE]/10"
            : "cursor-not-allowed"
        }`}
        aria-label={`Launch ${tool.name}`}
      >
        <div
          className="w-16 h-16 rounded-lg mb-3 flex items-center justify-center text-white"
          style={{ backgroundColor: iconBgColor }}
          aria-hidden="true"
        >
          {tool.icon && typeof tool.icon === "string" ? (
            <span className="text-2xl">{tool.icon}</span>
          ) : tool.icon ? (
            <div className="w-8 h-8 flex items-center justify-center">
              {tool.icon}
            </div>
          ) : (
            <div className="text-3xl font-bold">{tool.name.charAt(0)}</div>
          )}
        </div>

        <span className="text-sm font-medium text-white truncate max-w-full">
          {tool.name}
        </span>
      </button>

      {isHovered && tool.enabled && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-black/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl p-3"
          role="tooltip"
          aria-label={`${tool.name} - ${tool.description || ""}`}
        >
          <div className="flex items-start mb-2">
            <div
              className="w-10 h-10 rounded-lg mr-3 flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: iconBgColor }}
              aria-hidden="true"
            >
              {tool.icon && typeof tool.icon === "string" ? (
                <span>{tool.icon}</span>
              ) : tool.icon ? (
                <div className="w-6 h-6 flex items-center justify-center">
                  {tool.icon}
                </div>
              ) : (
                <span className="text-xl font-bold">{tool.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">{tool.name}</h3>
              <p className="text-xs text-gray-400">
                {tool.groupName || "Application"}
              </p>
            </div>
          </div>
          {tool.description && (
            <p className="text-xs text-gray-300 mt-1">{tool.description}</p>
          )}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-black/90 border-r border-b border-gray-700"></div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default function Tools() {
  const { vmStatus } = useContext(VMContext);
  const { openWindow, WINDOW_TYPES } = useWindowManager();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");

  // Memoize the tools list and filtering logic
  const { allTools, groupedTools } = useMemo(() => {
    const allToolsList = [];
    const groupedToolsList = Object.entries(toolsConfig.groups).map(
      ([groupId, group]) => {
        const toolsWithStatus = Object.entries(group.tools).map(
          ([_, tool]) => ({
            ...tool,
            enabled: vmStatus === "Started",
            groupId: groupId,
            groupName: group.name,
          })
        );

        allToolsList.push(...toolsWithStatus);

        return {
          ...group,
          id: groupId,
          tools: toolsWithStatus,
        };
      }
    );

    return { allTools: allToolsList, groupedTools: groupedToolsList };
  }, [vmStatus]);

  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tool.description &&
          tool.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesGroup =
        activeGroup === "all" || tool.groupId === activeGroup;

      return matchesSearch && matchesGroup;
    });
  }, [allTools, searchTerm, activeGroup]);

  const handleLaunchTool = useCallback(
    (tool) => {
      if (!tool.enabled) return;
      
      // Add debug console log to check tool and context
      console.log("Attempting to open tool:", tool);
      console.log("Window Types available:", WINDOW_TYPES);
      
      try {
        openWindow({
          type: WINDOW_TYPES.TOOL,
          toolId: tool.id,
          initialSize: { width: 800, height: 600 },
        });
        console.log("Window open called successfully");
      } catch (error) {
        console.error("Error opening window:", error);
      }
    },
    [openWindow, WINDOW_TYPES]
  );

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleGroupChange = useCallback((groupId) => {
    setActiveGroup(groupId);
  }, []);

  // Debug render log
  console.log("Tools rendering, vmStatus:", vmStatus);
  console.log("Filtered tools:", filteredTools.length);

  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-[#00ADEE] mb-4 md:mb-0">
          Applications
        </h1>
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="bg-black/40 border border-gray-700 rounded-md py-2 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-[#00ADEE] text-white placeholder-gray-400"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Search tools"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label="Clear search"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation */}
      <div
        className="flex space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-[#00ADEE]/50 scrollbar-track-transparent"
        role="tablist"
        aria-label="Tool categories"
      >
        <button
          onClick={() => handleGroupChange("all")}
          className={`px-4 py-2 rounded-md whitespace-nowrap ${
            activeGroup === "all"
              ? "bg-[#00ADEE]/20 text-[#00ADEE] border border-[#00ADEE]/50"
              : "bg-black/40 border border-gray-700/50 hover:bg-gray-800/50"
          }`}
          role="tab"
          aria-selected={activeGroup === "all"}
        >
          All Apps
        </button>
        {groupedTools.map((group) => (
          <button
            key={`group-${group.id}`}
            onClick={() => handleGroupChange(group.id)}
            className={`px-4 py-2 rounded-md whitespace-nowrap ${
              activeGroup === group.id
                ? "bg-[#00ADEE]/20 text-[#00ADEE] border border-[#00ADEE]/50"
                : "bg-black/40 border border-gray-700/50 hover:bg-gray-800/50"
            }`}
            role="tab"
            aria-selected={activeGroup === group.id}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* App Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4"
        role="grid"
        aria-label="Tools grid"
      >
        {filteredTools.map((tool) => (
          <AppIcon
            key={`tool-${tool.id}`}
            tool={tool}
            onClick={() => handleLaunchTool(tool)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTools.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 border border-gray-700/50 rounded-lg p-8 max-w-md"
          >
            <Info
              size={48}
              className="mx-auto mb-4 text-gray-400"
              aria-hidden="true"
            />
            <h3 className="text-xl font-semibold text-white mb-2">
              No matching apps found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search term or select a different category.
            </p>
          </motion.div>
        </div>
      )}

      {/* VM Status Warning */}
      {vmStatus !== "Started" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-16 left-0 right-0 mx-auto w-full max-w-md bg-yellow-900/80 backdrop-blur-md text-yellow-100 px-4 py-3 rounded-md shadow-lg border border-yellow-600/50 flex items-center justify-between"
          role="alert"
        >
          <div className="flex items-center">
            <Info size={18} className="mr-2" aria-hidden="true" />
            <span>
              Virtual Machine is not running. Apps will be disabled until VM is started.
            </span>
          </div>
        </motion.div>
      )}
    </main>
  );
}