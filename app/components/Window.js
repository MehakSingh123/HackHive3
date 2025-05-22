"use client";

import React, { useRef, useEffect, useCallback } from "react";

import { Rnd } from "react-rnd";

import { X, Minimize2 as Minimize } from "lucide-react";

import { useWindowManager } from "../contexts/WindowManagerContext";

import DynamicToolForm from "./DynamicTools";

import AIChatContent from "./AIChatContent";

// import Terminal from './Terminal'; // 1. REMOVE the static import of Terminal

import dynamic from "next/dynamic"; // 2. IMPORT dynamic

// 3. CREATE the dynamically imported Terminal component with SSR disabled

//  Define it outside the Window component function.

const TerminalWithNoSSR = dynamic(
  () => import("./Terminal"), // Make sure the path is correct

  { ssr: false } // Disable Server-Side Rendering for Terminal
);

const Window = ({ windowData }) => {
  const {
    closeWindow,

    toggleMinimizeWindow,

    bringToFront,

    updateWindowPosition,

    updateWindowSize,

    WINDOW_TYPES,

    getToolConfigById,
  } = useWindowManager();

  const {
    id,
    x,
    y,
    width,
    height,
    zIndex,
    minimized,
    title,
    type,
    toolId,
    IconComponent,
  } = windowData;

  const rndRef = useRef(null);

  // Set focus on mount

  useEffect(() => {
    if (!minimized) {
      bringToFront(id);
    }
  }, [id, minimized, bringToFront]);

  // --- Event Handlers --- (Keep these as they are)

  const handleDragStart = useCallback(() => {
    bringToFront(id);
  }, [id, bringToFront]);

  const handleDragStop = useCallback(
    (e, d) => {
      if (!e.target.closest("button")) {
        updateWindowPosition(id, d.x, d.y);
      }
    },
    [id, updateWindowPosition]
  );

  const handleResizeStart = useCallback(() => {
    bringToFront(id);
  }, [id, bringToFront]);

  const handleResizeStop = useCallback(
    (e, direction, ref, delta, position) => {
      updateWindowSize(id, ref.offsetWidth, ref.offsetHeight);

      updateWindowPosition(id, position.x, position.y);
    },
    [id, updateWindowPosition, updateWindowSize]
  );

  const handleWindowClick = useCallback(
    (e) => {
      if (!e.target.closest("button")) {
        bringToFront(id);
      }
    },
    [id, bringToFront]
  );

  // --- Content Rendering ---

  const renderContent = useCallback(() => {
    switch (type) {
      case WINDOW_TYPES.AI_CHAT:
        return <AIChatContent windowId={id} />;

      case WINDOW_TYPES.TERMINAL:
        // 4. USE the dynamically imported component here

        return <TerminalWithNoSSR windowId={id} />;

      case WINDOW_TYPES.TOOL:
        const toolConfig = getToolConfigById(toolId);

        return toolConfig ? (
          <DynamicToolForm toolConfig={toolConfig} windowId={id} />
        ) : (
          <div className="p-4 text-red-400">Error: Tool config not found</div>
        );

      default:
        return <div className="p-4">Unknown window type</div>;
    }
  }, [type, id, toolId, getToolConfigById, WINDOW_TYPES]); // Added WINDOW_TYPES dependency

  // If window is minimized, don't render it

  if (minimized) return null;

  return (
    // --- Keep the existing Rnd and layout structure ---

    <div
      style={{ position: "absolute", width: "100%", height: "100%", zIndex }}
    >
      <Rnd
        ref={rndRef}
        position={{ x, y }}
        size={{ width, height }}
        minWidth={400}
        minHeight={300}
        bounds="parent"
        dragHandleClassName="window-drag-handle"
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        onClick={handleWindowClick}
        enableResizing={{
          top: true,
          right: true,
          bottom: true,
          left: true,
          topRight: true,
          bottomRight: true,
          bottomLeft: true,
          topLeft: true,
        }}
      >
        <div className="h-full flex flex-col bg-[#0a0f1a]/95 backdrop-blur-md border border-[#00ADEE]/20 rounded-lg overflow-hidden">
          {/* Window Header */}

          <div className="window-drag-handle h-10 bg-gradient-to-b from-[#122335]/90 to-[#0e1622]/85 border-b border-[#00ADEE]/25 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none">
            {/* Left side: Icon and Title */}

            <div className="flex items-center gap-2 text-xs text-[#00ADEE]/90 overflow-hidden">
              {IconComponent && (
                <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {React.cloneElement(IconComponent, { size: 14 })}
                </span>
              )}

              <span className="font-medium truncate text-slate-200">
                {title}
              </span>
            </div>

            {/* Right side: Window Controls */}

            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimizeWindow(id);
                }}
                className="p-1.5 rounded text-gray-300 hover:text-yellow-300 hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                aria-label="Minimize Window"
              >
                <Minimize size={14} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(id);
                }}
                className="p-1.5 rounded text-gray-300 hover:text-red-400 hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-red-500"
                aria-label="Close Window"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Window Content */}

          <div className="flex-1 overflow-hidden">{renderContent()}</div>
        </div>
      </Rnd>
    </div>
  );
};

export default Window;
