"use client";
import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindowManager } from "../contexts/WindowManagerContext";
import { TerminalSquare, MessageCircle, Settings2, X } from "lucide-react";

const Taskbar = () => {
  const {
    windows,
    toggleMinimizeWindow,
    bringToFront,
    openWindow,
    closeWindow,
    WINDOW_TYPES,
  } = useWindowManager();

  const taskbarRef = useRef(null);

  const handleTaskbarClick = (id, isMinimized) => {
    if (isMinimized) {
      toggleMinimizeWindow(id);
    } else {
      bringToFront(id);
    }
  };

  const handleCloseWindow = (e, id) => {
    e.stopPropagation();
    closeWindow(id);
  };

  // Launch core application
  const launchApp = (type) => {
    // Check if window already exists
    const existing = windows.find((w) => w.type === type);

    if (existing) {
      handleTaskbarClick(existing.id, existing.minimized);
      return;
    }

    // Configure window settings based on type
    const appConfigs = {
      [WINDOW_TYPES.TERMINAL]: { 
        width: 700, 
        height: 450,
        title: "Terminal",
        IconComponent: <TerminalSquare /> 
      },
      [WINDOW_TYPES.AI_CHAT]: { 
        width: 500, 
        height: 650,
        title: "AI Chat",
        IconComponent: <MessageCircle />
      },
    };

    // Open a new window
    openWindow({
      type,
      title: appConfigs[type]?.title || "Window",
      IconComponent: appConfigs[type]?.IconComponent || <Settings2 />,
      initialSize: { 
        width: appConfigs[type]?.width || 600, 
        height: appConfigs[type]?.height || 400 
      },
    });
  };

  // Animation variants
  const buttonVariants = {
    hover: { scale: 1.1, transition: { duration: 0.1 } },
    tap: { scale: 0.9, transition: { duration: 0.1 } },
  };

  const taskbarItemVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 400, damping: 17 },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  // Quick access app buttons
  const quickLaunchApps = [
    {
      type: WINDOW_TYPES.TERMINAL,
      icon: <TerminalSquare size={20} />,
      title: "Open Terminal",
    },
    {
      type: WINDOW_TYPES.AI_CHAT,
      icon: <MessageCircle size={20} />,
      title: "Open AI Chat",
    },
  ];

  return (
    <motion.div
      ref={taskbarRef}
      data-taskbar="true"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.5 }}
      className="fixed bottom-0 left-0 right-0 h-12 bg-black/50 backdrop-blur-lg border-t border-gray-700/50 flex items-center px-4 z-50 shadow-lg"
    >
      {/* Launch Buttons */}
      {quickLaunchApps.map((app) => (
        <motion.button
          key={app.type}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => launchApp(app.type)}
          className="p-2 rounded hover:bg-white/10 text-gray-300 hover:text-[#00ADEE] transition-colors mr-2"
          title={app.title}
        >
          {app.icon}
        </motion.button>
      ))}

      {/* Separator */}
      <div className="h-6 w-px bg-gray-600/50 mr-4"></div>

      {/* Open Window Icons */}
      <div className="flex items-center space-x-2 overflow-x-auto h-full py-1">
        <AnimatePresence>
          {windows.map((win) => {
            const { id, title, IconComponent, minimized } = win;
            const isActive =
              !minimized &&
              windows.reduce((maxZ, w) => Math.max(maxZ, w.zIndex), 0) ===
                win.zIndex;

            return (
              <motion.div
                key={id}
                layout
                variants={taskbarItemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="relative flex items-center justify-between h-full"
              >
                <div className="flex items-center justify-between h-full relative group">
                  <motion.div
                    data-window-id={id}
                    onClick={() => handleTaskbarClick(id, minimized)}
                    className={`flex items-center h-full px-2 py-1 rounded cursor-pointer ${
                      isActive
                        ? "bg-[#00ADEE]/30 border border-[#00ADEE]/50"
                        : "bg-gray-700/30 hover:bg-gray-600/50"
                    } ${
                      minimized
                        ? "border-b-2 border-[#00ADEE]/70"
                        : "border border-transparent"
                    } transition-all duration-150 ease-in-out`}
                    title={title}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {IconComponent && React.isValidElement(IconComponent) ? (
                      <span className="w-4 h-4 mr-2 flex items-center justify-center flex-shrink-0">
                        {React.cloneElement(IconComponent, { size: 14 })}
                      </span>
                    ) : (
                      <Settings2
                        size={14}
                        className="w-4 h-4 mr-2 flex-shrink-0"
                      />
                    )}
                    <span className="text-xs text-white truncate max-w-[100px]">
                      {title}
                    </span>
                    <motion.div
                      onClick={(e) => handleCloseWindow(e, id)}
                      className="ml-1 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/30 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                      title={`Close ${title}`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X size={12} />
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Taskbar;