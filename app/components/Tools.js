"use client";

import { useContext, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { VMContext } from "../contexts/VMContext";
import { useWindowManager } from "../contexts/WindowManagerContext";
import { toolsConfig } from "../..//public/toolsConfig";
import { Search, Info, X } from "lucide-react";
import React from "react";
import PhishingToolCard from "./PhishingToolCard";

// Import the PhishingToolCard component
// import PhishingToolCard from "../components/PhishingToolCard";

// Separate AppIcon component for regular tools
const AppIcon = ({ tool, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  // Use iconBgColor from config or fallback
  const iconBgColor = tool.iconBgColor || "#1e293b";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: tool.enabled ? 1.05 : 1 }}
      whileTap={{ scale: tool.enabled ? 0.95 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`relative ${!tool.enabled ? "opacity-60" : ""}`}
      onMouseEnter={() => setIsHovered(tool.enabled)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        disabled={!tool.enabled}
        className={`w-full aspect-square bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden flex flex-col items-center justify-center text-center p-4 relative transition-all duration-200 ${
          tool.enabled
            ? "hover:bg-[#00ADEE]/10 hover:border-[#00ADEE]/30 hover:shadow-lg hover:shadow-[#00ADEE]/10 cursor-pointer"
            : "cursor-not-allowed"
        }`}
        aria-label={`Launch ${tool.name}`}
      >
        {/* Icon Display */}
        <div
          className="w-16 h-16 rounded-lg mb-3 flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: iconBgColor }}
          aria-hidden="true"
        >
          {tool.icon && typeof tool.icon === "string" ? (
            <span className="text-2xl">{tool.icon}</span>
          ) : tool.icon && React.isValidElement(tool.icon) ? (
             React.cloneElement(tool.icon, { size: 32 })
          ) : (
            <div className="text-3xl font-bold">{tool.name.charAt(0)}</div>
          )}
        </div>

        {/* Tool Name */}
        <span className="text-sm font-medium text-white truncate max-w-full block">
          {tool.name}
        </span>
      </button>

      {/* Tooltip on Hover (Only for enabled AppIcons) */}
      {isHovered && tool.enabled && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-black/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl p-3 pointer-events-none"
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
                   <span className="text-lg">{tool.icon}</span>
                ) : tool.icon && React.isValidElement(tool.icon) ? (
                   React.cloneElement(tool.icon, { size: 20 })
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
          {/* Use the short description from the main tool config */}
          {tool.description && (
            <p className="text-xs text-gray-300 mt-1">{tool.description}</p>
          )}
          {/* Tooltip arrow */}
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
  // Add state to track which phishing tool card is open
  const [openPhishingToolId, setOpenPhishingToolId] = useState(null);

  // Memoize the tools list and filtering logic
  const { allTools, groupedTools } = useMemo(() => {
    // Check if toolsConfig and toolsConfig.groups exist to prevent runtime errors
    if (!toolsConfig || !toolsConfig.groups) {
      console.error("toolsConfig or toolsConfig.groups is undefined");
      return { allTools: [], groupedTools: [] };
    }

    const allToolsList = [];
    const groupedToolsList = Object.entries(toolsConfig.groups).map(
      ([groupId, group]) => {
        // Check if group.tools exists
        if (!group || !group.tools) {
          console.warn(`Group ${groupId} is missing or has no tools property`);
          return {
            ...group,
            id: groupId,
            tools: []
          };
        }

        const toolsWithStatus = Object.entries(group.tools).map(
          ([toolKey, tool]) => {
            // Handle case where tool might be undefined
            if (!tool) {
              console.warn(`Tool ${toolKey} in group ${groupId} is undefined`);
              return null;
            }
           
            return {
              ...tool,
              id: tool.id ?? toolKey,
              enabled: vmStatus === "Started",
              groupId: groupId,
              groupName: group.name,
              iconBgColor: tool.iconBgColor || '#1e293b'
            };
          }
        ).filter(Boolean); // Filter out any null values from undefined tools

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

  // Filter tools based on search and active group
  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        tool.name.toLowerCase().includes(searchLower) ||
        (tool.description && tool.description.toLowerCase().includes(searchLower)) ||
        (tool.info?.description && tool.info.description.toLowerCase().includes(searchLower));

      const matchesGroup =
        activeGroup === "all" || tool.groupId === activeGroup;

      return matchesSearch && matchesGroup;
    });
  }, [allTools, searchTerm, activeGroup]);

  // Handle tool click - either launch a window or show phishing tool card
  const handleToolClick = useCallback(
    (tool) => {
      if (!tool.enabled) return;
      
      if (tool.isInfoOnly) {
        // Toggle the phishing tool card
        setOpenPhishingToolId(openPhishingToolId === tool.id ? null : tool.id);
      } else {
        // Launch regular tool window
        if (!tool.id) {
          console.error("Tool is missing id property:", tool);
          return;
        }

        if (!WINDOW_TYPES || !WINDOW_TYPES.TOOL) {
          console.error("WINDOW_TYPES is missing or doesn't have TOOL property:", WINDOW_TYPES);
          return;
        }

        try {
          openWindow({
            type: WINDOW_TYPES.TOOL,
            toolId: tool.id,
            title: tool.name,
            initialSize: { width: 800, height: 600 },
          });
          console.log("Window opened successfully for tool:", tool.name);
        } catch (error) {
          console.error("Error opening window for tool:", tool.name, error);
        }
      }
    },
    [openWindow, WINDOW_TYPES, openPhishingToolId]
  );

  // Handle closing phishing tool card
  const handleClosePhishingTool = useCallback(() => {
    setOpenPhishingToolId(null);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleGroupChange = useCallback((groupId) => {
    setActiveGroup(groupId);
  }, []);

  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#00ADEE] mb-4 md:mb-0">
          Applications
        </h1>
        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="bg-black/40 border border-gray-700 rounded-md py-2 pl-10 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-[#00ADEE] text-white placeholder-gray-400"
            placeholder="Search apps..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Search applications"
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
        {/* "All Apps" Button */}
        <button
          onClick={() => handleGroupChange("all")}
          className={`px-4 py-2 rounded-md text-sm whitespace-nowrap transition-colors duration-150 ${
            activeGroup === "all"
              ? "bg-[#00ADEE]/20 text-[#00ADEE] border border-[#00ADEE]/50 font-medium"
              : "bg-black/40 border border-gray-700/50 text-gray-300 hover:bg-gray-800/50 hover:text-white"
          }`}
          role="tab"
          aria-selected={activeGroup === "all"}
        >
          All Apps
        </button>
        {/* Group Buttons */}
        {groupedTools.map((group) => (
          <button
            key={`group-${group.id}`}
            onClick={() => handleGroupChange(group.id)}
            className={`px-4 py-2 rounded-md text-sm whitespace-nowrap transition-colors duration-150 ${
              activeGroup === group.id
                ? "bg-[#00ADEE]/20 text-[#00ADEE] border border-[#00ADEE]/50 font-medium"
                : "bg-black/40 border border-gray-700/50 text-gray-300 hover:bg-gray-800/50 hover:text-white"
            }`}
            role="tab"
            aria-selected={activeGroup === group.id}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* App Grid */}
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4"
        role="grid"
        aria-label="Applications grid"
      >
        {filteredTools.map((tool) => {
          // Check if this is the phishing tool that should be shown as a card
          if (tool.isInfoOnly && openPhishingToolId === tool.id) {
            return (
              <motion.div
                key={`tool-card-${tool.id}`}
                className="col-span-2 md:col-span-3 lg:col-span-3 row-span-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
              >
                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/70 rounded-xl overflow-hidden h-full relative">
                  {/* Close button */}
                  <button 
                    onClick={handleClosePhishingTool}
                    className="absolute top-3 right-3 p-1.5 bg-slate-700/70 hover:bg-slate-600 rounded-full text-gray-300 hover:text-white transition-colors z-10"
                    aria-label="Close information card"
                  >
                    <X size={16} />
                  </button>
                  
                  {/* Use the PhishingToolCard component with the tool */}
                  <PhishingToolCard
                    tool={tool}
                    onClose={handleClosePhishingTool}
                  />
                </div>
              </motion.div>
            );
          } else {
            // Render as an AppIcon (for both regular tools and unopened phishing tools)
            return (
              <AppIcon
                key={`tool-${tool.id}`}
                tool={tool}
                onClick={() => handleToolClick(tool)}
              />
            );
          }
        })}
      </motion.div>

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
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md z-50 bg-yellow-900/90 backdrop-blur-sm text-yellow-100 px-4 py-3 rounded-lg shadow-lg border border-yellow-600/50 flex items-center justify-between"
          role="alert"
        >
          <div className="flex items-center">
            <Info size={18} className="mr-2 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm">
              Virtual Machine is not running. Apps are disabled until VM starts.
            </span>
          </div>
        </motion.div>
      )}
    </main>
  );
}