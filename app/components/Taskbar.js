// components/Taskbar.js
"use client";

import { useState, useContext, Fragment } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VMContext } from "../contexts/VMContext";
import { useWindowManager } from '../contexts/WindowManagerContext'; // Import window manager
import StartMenu from './StartMenu'; // Import StartMenu component
import {
    Home, Activity, Bot, Settings, BookOpen, Target, Power, Server, ChevronUp, X, Grid, MessageSquare, Terminal as TerminalIcon // Added Grid, MessageSquare, TerminalIcon
} from "lucide-react";
// *** Corrected import: Added AnimatePresence ***
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Transition, Popover } from '@headlessui/react';

export default function Taskbar() {
    const { vmStatus, startVM, stopVM } = useContext(VMContext);
    const { openWindow, getWindowByType, toggleMinimizeWindow, bringToFront, WINDOW_TYPES, windows } = useWindowManager(); // Use window manager
    const pathname = usePathname();
    // Note: isStartMenuOpen state might not be needed if Popover handles its own 'open' state directly
    // const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

    // Check if windows are open (even if minimized)
    const isChatOpen = !!getWindowByType(WINDOW_TYPES.AI_CHAT);
    const isTerminalOpen = !!getWindowByType(WINDOW_TYPES.TERMINAL);
    const chatWindow = getWindowByType(WINDOW_TYPES.AI_CHAT);
    const terminalWindow = getWindowByType(WINDOW_TYPES.TERMINAL);


    // --- getStatusColorClasses, getPowerIconColor (Functions remain the same) ---
    const getStatusColorClasses = () => {
        if (vmStatus === "Started") return "bg-green-500/80 border-green-400/50";
        if (vmStatus === "Starting..." || vmStatus === "Stopping...") return "bg-yellow-500/80 border-yellow-400/50 animate-pulse";
        if (vmStatus.startsWith("Error")) return "bg-red-600/80 border-red-500/50";
        return "bg-gray-600/80 border-gray-500/50";
    };

    const getPowerIconColor = () => {
        if (vmStatus === "Started") return "text-green-400";
        if (vmStatus === "Starting..." || vmStatus === "Stopping...") return "text-yellow-400";
        if (vmStatus.startsWith("Error")) return "text-red-400";
        return "text-gray-400";
    }
    // --- End kept logic ---

    const handleToggleWindow = (type, title) => {
        const existingWindow = getWindowByType(type);
        if (existingWindow) {
            // If minimized, unminimize and bring to front
            if (existingWindow.minimized) {
                toggleMinimizeWindow(existingWindow.id); // This already brings to front on unminimize
            } else {
                // If already open and not minimized, just bring to front
                bringToFront(existingWindow.id);
            }
        } else {
            // If not open, open it
            openWindow({ type, title });
        }
    };

    // Function to get taskbar item background based on window state
    const getTaskbarItemBackground = (window) => {
        if (!window) return 'hover:bg-white/10'; // Not open
        if (!window.minimized) return 'bg-[#00ADEE]/20'; // Open and active/visible
        return 'bg-gray-600/20 hover:bg-gray-500/30'; // Minimized
    };


    return (
        <footer className="h-12 bg-black/50 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-3 shadow-lg z-30 flex-shrink-0">
            {/* Left Side: Start Button & Core Apps */}
            <nav className="flex items-center space-x-1.5">
                {/* Start Menu Button */}
                <Popover className="relative">
                    {({ open, close }) => ( // Get close function from Popover render prop
                        <>
                            <Popover.Button
                                as={motion.button}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`p-2 rounded-md transition-colors ${open ? 'bg-[#00ADEE]/30' : 'hover:bg-white/10'}`}
                                // onClick={() => setIsStartMenuOpen(!isStartMenuOpen)} // Let Popover handle open state
                                title="Start Menu"
                            >
                                <Grid size={20} className="text-[#00ADEE]" />
                            </Popover.Button>
                            {/* AnimatePresence correctly wraps the conditional rendering */}
                            <AnimatePresence>
                                {open && (
                                    <Popover.Panel
                                        static // Keep mounted for animation controlled by AnimatePresence
                                        as={motion.div}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }} // Added exit transition
                                        transition={{ duration: 0.2 }}
                                        className="absolute bottom-full left-0 mb-2 w-72 origin-bottom-left rounded-lg shadow-2xl focus:outline-none z-40 overflow-hidden"
                                    >
                                        {/* Render StartMenu Content Here, pass the close function */}
                                        <StartMenu closeMenu={close} />
                                    </Popover.Panel>
                                )}
                           </AnimatePresence>
                        </>
                    )}
                </Popover>

                {/* AI Chat Toggle */}
                <motion.button
                    whileHover={{ scale: 1.1, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleWindow(WINDOW_TYPES.AI_CHAT, 'HiveMind AI')}
                    className={`p-2 rounded-md relative transition-colors ${getTaskbarItemBackground(chatWindow)}`}
                    title="AI Chat"
                >
                    <MessageSquare size={18} className={`transition-colors ${chatWindow && !chatWindow.minimized ? 'text-[#00ADEE]' : 'text-gray-300'}`} />
                    {/* Indicator Dot if open */}
                    {isChatOpen && <span className={`absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 ${chatWindow?.minimized ? 'bg-gray-500' : 'bg-[#00ADEE]'} rounded-full`}></span>}
                </motion.button>

                {/* Terminal Toggle */}
                <motion.button
                    whileHover={{ scale: 1.1, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleWindow(WINDOW_TYPES.TERMINAL, 'Terminal')}
                    className={`p-2 rounded-md relative transition-colors ${getTaskbarItemBackground(terminalWindow)}`}
                    title="Terminal"
                >
                    <TerminalIcon size={18} className={`transition-colors ${terminalWindow && !terminalWindow.minimized ? 'text-cyan-400' : 'text-gray-300'}`} />
                    {/* Indicator Dot if open */}
                    {isTerminalOpen && <span className={`absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 ${terminalWindow?.minimized ? 'bg-gray-500' : 'bg-cyan-400'} rounded-full`}></span>}
                </motion.button>

                {/* Placeholder for other open app icons - more complex */}

            </nav>

            {/* Right Side: System Tray / VM Control */}
            <div className="flex items-center space-x-3">
                {/* VM Status Indicator */}
                <div className="flex items-center space-x-1.5" title={`VM Status: ${vmStatus}`}>
                    <span className={`w-2.5 h-2.5 rounded-full border ${getStatusColorClasses()}`}></span>
                    <span className="text-xs text-gray-300 hidden md:inline">{vmStatus}</span>
                </div>

                {/* Power Button Menu (Keep as is) */}
                <Menu as="div" className="relative inline-block text-left">
                    <div>
                        <Menu.Button
                            as={motion.button}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${getPowerIconColor()}`}
                            title="VM Controls"
                        >
                            <Power size={18} />
                        </Menu.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 bottom-full mb-2 w-48 origin-bottom-right rounded-md bg-[#0A2540]/90 backdrop-blur-md shadow-lg ring-1 ring-white/10 focus:outline-none border border-[#00ADEE]/30 z-40">
                            <div className="px-1 py-1">
                                <div className="px-3 py-2 text-sm font-medium text-[#00ADEE] border-b border-white/10 mb-1">
                                    VM Control
                                </div>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={startVM}
                                            disabled={vmStatus === "Started" || vmStatus === "Starting..."}
                                            className={`${active ? 'bg-[#00ADEE]/20 text-[#00ADEE]' : 'text-gray-200'
                                                } group flex w-full items-center rounded-md px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            Start VM
                                        </button>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={stopVM}
                                            disabled={vmStatus === "Stopped" || vmStatus === "Stopping..." || vmStatus.startsWith("Error")}
                                            className={`${active ? 'bg-red-600/30 text-red-400' : 'text-gray-200'
                                                } group flex w-full items-center rounded-md px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                            Stop VM
                                        </button>
                                    )}
                                </Menu.Item>
                                <div className="px-3 py-2 text-xs text-gray-400 border-t border-white/10 mt-1">
                                    Status: {vmStatus}
                                </div>
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>
        </footer>
    );
}