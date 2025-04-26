"use client";
import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowManager } from '../contexts/WindowManagerContext';
import { TerminalSquare, MessageCircle, Settings2 } from 'lucide-react';

const Taskbar = () => {
    const { windows, toggleMinimizeWindow, bringToFront, openWindow, WINDOW_TYPES } = useWindowManager();
    const taskbarRef = useRef(null);

    const handleTaskbarClick = (id, isMinimized) => {
        if (isMinimized) {
            toggleMinimizeWindow(id);
        } else {
            bringToFront(id);
        }
    };

    // Function to launch core apps
    const launchApp = (type) => {
        const existing = windows.find(w => w.type === type);
        if (existing) {
            handleTaskbarClick(existing.id, existing.minimized);
        } else {
            let config = { type };
            if(type === WINDOW_TYPES.TERMINAL) config.initialSize = { width: 700, height: 450 };
            if(type === WINDOW_TYPES.AI_CHAT) config.initialSize = { width: 500, height: 650 };
            openWindow(config);
        }
    };

    // Animation variants for taskbar icons
    const buttonVariants = {
        hover: { scale: 1.1, transition: { duration: 0.1 } },
        tap: { scale: 0.9, transition: { duration: 0.1 } },
    };

    // Animation for taskbar buttons
    const taskbarItemVariants = {
        initial: { scale: 0.8, opacity: 0 },
        animate: { 
            scale: 1, 
            opacity: 1, 
            transition: { 
                type: 'spring',
                stiffness: 400,
                damping: 17
            } 
        },
        exit: { 
            scale: 0.8, 
            opacity: 0,
            transition: { 
                duration: 0.2
            } 
        }
    };

    return (
        <motion.div
            ref={taskbarRef}
            data-taskbar="true"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.5 }}
            className="fixed bottom-0 left-0 right-0 h-12 bg-black/50 backdrop-blur-lg border-t border-gray-700/50 flex items-center px-4 z-50 shadow-lg"
        >
            {/* Launch Buttons */}
            <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => launchApp(WINDOW_TYPES.TERMINAL)}
                className="p-2 rounded hover:bg-white/10 text-gray-300 hover:text-[#00ADEE] transition-colors mr-2"
                title="Open Terminal"
            >
                <TerminalSquare size={20} />
            </motion.button>
            
            <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => launchApp(WINDOW_TYPES.AI_CHAT)}
                className="p-2 rounded hover:bg-white/10 text-gray-300 hover:text-[#00ADEE] transition-colors mr-4"
                title="Open AI Chat"
            >
                <MessageCircle size={20} />
            </motion.button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-600/50 mr-4"></div>

            {/* Open Window Icons */}
            <div className="flex items-center space-x-2 overflow-x-auto h-full py-1">
                <AnimatePresence>
                    {windows.map(win => {
                        const { id, title, IconComponent, minimized } = win;
                        const isActive = !minimized && windows.reduce((maxZ, w) => Math.max(maxZ, w.zIndex), 0) === win.zIndex;

                        return (
                            <motion.button
                                key={id}
                                data-window-id={id}
                                layout
                                onClick={() => handleTaskbarClick(id, minimized)}
                                className={`flex items-center h-full px-3 py-1 rounded ${
                                    isActive ? 'bg-[#00ADEE]/30 border border-[#00ADEE]/50' : 'bg-gray-700/30 hover:bg-gray-600/50'
                                } ${minimized ? 'border-b-2 border-[#00ADEE]/70' : 'border border-transparent'} transition-all duration-150 ease-in-out`}
                                title={title}
                                variants={taskbarItemVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                whileHover="hover"
                                whileTap="tap"
                            >
                                {IconComponent && React.isValidElement(IconComponent) && (
                                    <span className="w-4 h-4 mr-2 flex items-center justify-center flex-shrink-0">
                                        {React.cloneElement(IconComponent, { size: 14 })}
                                    </span>
                                )}
                                {!IconComponent && <Settings2 size={14} className="w-4 h-4 mr-2 flex-shrink-0"/>}
                                <span className="text-xs text-white truncate max-w-[100px]">{title}</span>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default Taskbar;