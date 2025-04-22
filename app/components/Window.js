// components/Window.js
"use client";

import React from 'react';
import { Rnd } from 'react-rnd';
import { X, Minimize, Square } from 'lucide-react'; // Using Square for placeholder Restore/Maximize
import { motion } from 'framer-motion';
import { useWindowManager } from '../contexts/WindowManagerContext';
import DynamicToolForm from './DynamicTools'; // Make sure path is correct
import AIChatContent from './AIChatContent'; // Create this (refactored AIChat)
import TerminalContent from './TerminalContent'; // Create this (refactored Terminal)
import { toolsConfig } from "@/public/toolsConfig"; // Assuming path

const Window = ({ windowData }) => {
    const {
        closeWindow,
        toggleMinimizeWindow,
        bringToFront,
        updateWindowPosition,
        updateWindowSize,
        WINDOW_TYPES
    } = useWindowManager();

    const { id, x, y, width, height, zIndex, minimized, title, type, toolId } = windowData;

    const handleDragStop = (e, d) => {
        updateWindowPosition(id, d.x, d.y);
    };

    const handleResizeStop = (e, direction, ref, delta, position) => {
        updateWindowSize(id, parseInt(ref.style.width), parseInt(ref.style.height));
        updateWindowPosition(id, position.x, position.y); // Update position in case resize changes it
    };

    const getToolConfig = (id) => {
        if (!id) return null;
        return Object.values(toolsConfig.groups)
            .flatMap((group) => Object.values(group.tools))
            .find((tool) => tool.id === id);
    };

    const renderContent = () => {
        switch (type) {
            case WINDOW_TYPES.AI_CHAT:
                return <AIChatContent />; // Pass props if needed
            case WINDOW_TYPES.TERMINAL:
                return <TerminalContent />; // Pass props if needed
            case WINDOW_TYPES.TOOL:
                const toolConfig = getToolConfig(toolId);
                if (toolConfig) {
                    // Pass onClose to DynamicToolForm which now closes the window
                    return <DynamicToolForm toolConfig={toolConfig} onClose={() => closeWindow(id)} />;
                }
                return <div>Error: Tool config not found for {toolId}</div>;
            default:
                return <div>Unknown window type</div>;
        }
    };

     const toolData = type === WINDOW_TYPES.TOOL ? getToolConfig(toolId) : null;
     const IconComponent = type === WINDOW_TYPES.TOOL && toolData ? toolData.icon : Square; // Placeholder


    if (minimized) {
        return null; // Don't render the full window when minimized (Taskbar handles this)
    }

    return (
        <Rnd
            size={{ width, height }}
            position={{ x, y }}
            minWidth={300}
            minHeight={200}
            bounds="parent" // Constrain dragging/resizing to the parent element
            style={{ zIndex }}
            onDragStart={() => bringToFront(id)}
            onDragStop={handleDragStop}
            onResizeStart={() => bringToFront(id)}
            onResizeStop={handleResizeStop}
            dragHandleClassName="window-drag-handle" // Class for the draggable title bar
            className="flex flex-col bg-[#0A0F14]/90 backdrop-blur-lg border border-[#00ADEE]/30 rounded-lg shadow-xl overflow-hidden"
            onMouseDown={() => bringToFront(id)} // Bring to front on click anywhere on window
        >
            {/* Title Bar */}
            <div className="window-drag-handle h-8 bg-gradient-to-b from-[#081A2C]/90 to-[#0A2540]/80 border-b border-[#00ADEE]/20 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing flex-shrink-0">
                <div className="flex items-center gap-2 text-xs text-[#00ADEE]/90 overflow-hidden">
                     {IconComponent && React.isValidElement(IconComponent) && (
                         <span className="w-4 h-4 flex items-center justify-center">{React.cloneElement(IconComponent, {size: 14})}</span>
                     )}
                    <span className="font-medium truncate text-white/90">{title}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 0, 0.2)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); toggleMinimizeWindow(id); }}
                        className="p-1 rounded text-gray-300 hover:text-yellow-300"
                        title="Minimize"
                    >
                        <Minimize size={12} />
                    </motion.button>
                    {/* Placeholder for Maximize/Restore */}
                    {/* <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1 rounded text-gray-300 hover:text-white"><Square size={12} /></motion.button> */}
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 0, 0, 0.3)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                        className="p-1 rounded text-gray-300 hover:text-red-400"
                        title="Close"
                    >
                        <X size={14} />
                    </motion.button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-1 bg-[#0A0F14]/50"> {/* Adjust padding/bg as needed */}
                {renderContent()}
            </div>
        </Rnd>
    );
};

export default Window;