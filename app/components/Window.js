"use client";
import React, { useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minimize2 as Minimize } from 'lucide-react';
import { useWindowManager } from '../contexts/WindowManagerContext';
import DynamicToolForm from './DynamicTools';
import AIChatContent from './AIChatContent';
import TerminalContent from './TerminalContent';

const Window = ({ windowData }) => {
    const {
        closeWindow,
        toggleMinimizeWindow,
        bringToFront,
        updateWindowPosition,
        updateWindowSize,
        WINDOW_TYPES,
        getToolConfigById
    } = useWindowManager();

    const { id, x, y, width, height, zIndex, minimized, title, type, toolId, IconComponent } = windowData;
    const rndRef = useRef(null);

    // Set focus on mount
    useEffect(() => {
        if (!minimized) {
            bringToFront(id);
        }
    }, []);

    // --- Drag and Resize Handlers ---
    const handleDragStart = () => {
        bringToFront(id);
    };

    const handleDragStop = (e, d) => {
        // Check if the target is not a button (using class detection)
        const isButton = e.target.tagName.toLowerCase() === 'button' || 
                        e.target.closest('button') !== null;
        
        if (!isButton) {
            updateWindowPosition(id, d.x, d.y);
        }
    };

    const handleResizeStart = () => {
        bringToFront(id);
    };

    const handleResizeStop = (e, direction, ref, delta, position) => {
        updateWindowSize(id, ref.offsetWidth, ref.offsetHeight);
        updateWindowPosition(id, position.x, position.y);
    };

    // Handle window click for focus
    const handleWindowClick = (e) => {
        bringToFront(id);
    };

    // --- Content Rendering ---
    const renderContent = () => {
        switch (type) {
            case WINDOW_TYPES.AI_CHAT:
                return <AIChatContent windowId={id} />;
            case WINDOW_TYPES.TERMINAL:
                return <TerminalContent windowId={id} />;
            case WINDOW_TYPES.TOOL:
                const toolConfig = getToolConfigById(toolId);
                return toolConfig ? (
                    <DynamicToolForm toolConfig={toolConfig} onClose={() => closeWindow(id)} windowId={id} />
                ) : (
                    <div className="p-4 text-red-400">Error: Tool config not found</div>
                );
            default:
                return <div className="p-4">Unknown window type</div>;
        }
    };

    // If window is minimized, don't render it
    if (minimized) return null;

    return (
        <Rnd
            ref={rndRef}
            size={{ width, height }}
            position={{ x, y }}
            minWidth={350}
            minHeight={250}
            bounds="parent"
            lockAspectRatio={false}
            onDragStart={handleDragStart}
            onDragStop={handleDragStop}
            onResizeStart={handleResizeStart}
            onResizeStop={handleResizeStop}
            dragGrid={[1, 1]}
            resizeGrid={[1, 1]}
            enableResizing={{
                bottom: true, bottomLeft: true, bottomRight: true,
                left: true, right: true, top: true, topLeft: true, topRight: true
            }}
            dragHandleClassName="window-drag-handle"
            // Removed disableDropping prop that was causing the error
            style={{
                zIndex,
            }}
            className="flex flex-col bg-[#0e1622]/80 backdrop-blur-md border border-[#00ADEE]/40 rounded-lg shadow-2xl overflow-hidden"
            onClick={handleWindowClick}
        >
            {/* Title Bar */}
            <div className="window-drag-handle h-8 bg-gradient-to-b from-[#122335]/90 to-[#0e1622]/85 border-b border-[#00ADEE]/25 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing select-none">
                {/* Left side: Icon and Title */}
                <div className="flex items-center gap-2 text-xs text-[#00ADEE]/90 overflow-hidden">
                    {IconComponent && (
                        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            {React.cloneElement(IconComponent, { size: 14 })}
                        </span>
                    )}
                    <span className="font-medium truncate text-slate-200">{title}</span>
                </div>

                {/* Right side: Buttons - Make sure these don't trigger drag */}
                <div className="flex items-center space-x-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMinimizeWindow(id);
                        }}
                        className="p-1 rounded text-gray-300 hover:text-yellow-300 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                        aria-label="Minimize Window"
                    >
                        <Minimize size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            closeWindow(id);
                        }}
                        className="p-1 rounded text-gray-300 hover:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                        aria-label="Close Window"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-[#0A0F14]/60">
                {renderContent()}
            </div>
        </Rnd>
    );
};

export default Window;