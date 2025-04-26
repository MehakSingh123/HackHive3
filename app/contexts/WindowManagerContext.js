// contexts/WindowManagerContext.js
"use client";
import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid: npm install uuid

export const WindowManagerContext = createContext();

export const WINDOW_TYPES = {
    TOOL: 'TOOL',
    AI_CHAT: 'AI_CHAT',
    TERMINAL: 'TERMINAL',
};

// Function to get tool config (moved here for reuse)
import { toolsConfig } from "@/public/toolsConfig"; // Assuming path
const getToolConfigById = (toolId) => {
    if (!toolId) return null;
    return Object.values(toolsConfig.groups)
        .flatMap((group) => Object.values(group.tools))
        .find((tool) => tool.id === toolId);
};


export const WindowManagerProvider = ({ children }) => {
    const [windows, setWindows] = useState([]);
    const nextZIndex = useRef(10); // Start z-index counter

    const bringToFront = useCallback((id) => {
        setWindows(prevWindows => {
            const newZIndex = nextZIndex.current++;
            return prevWindows.map(win =>
                win.id === id ? { ...win, zIndex: newZIndex, minimized: false } : win // Also unminimize on bringToFront
            );
        });
    }, []);

    const openWindow = useCallback((windowConfig) => {
        const { type, toolId, initialPosition, initialSize } = windowConfig;

        // Prevent opening multiple instances of singleton windows (like AI Chat/Terminal)
        const existingWindow = windows.find(win => win.type === type && (type !== WINDOW_TYPES.TOOL)); // Allow multiple tool windows
         const existingToolWindow = type === WINDOW_TYPES.TOOL ? windows.find(win => win.toolId === toolId) : null;


        if (existingWindow) {
             if (existingWindow.minimized) {
                toggleMinimizeWindow(existingWindow.id); // Restore if minimized
            } else {
                bringToFront(existingWindow.id); // Bring to front if already open
            }
            return; // Don't open a new one
        }

        // Prevent duplicate tool windows (optional - remove if multiple instances are desired)
        if (existingToolWindow) {
             if (existingToolWindow.minimized) {
                toggleMinimizeWindow(existingToolWindow.id); // Restore if minimized
            } else {
                bringToFront(existingToolWindow.id); // Bring to front if already open
            }
             return;
        }


        const newWindowId = uuidv4();
        const newZIndex = nextZIndex.current++;

        let title = "Window";
        let defaultWidth = 600;
        let defaultHeight = 400;
        let IconComponent = null; // Placeholder

        switch (type) {
            case WINDOW_TYPES.AI_CHAT:
                title = "AI Chat";
                defaultWidth = 500;
                defaultHeight = 650;
                // Add specific icon if desired
                break;
            case WINDOW_TYPES.TERMINAL:
                title = "Terminal";
                defaultWidth = 700;
                defaultHeight = 450;
                // Add specific icon if desired
                break;
            case WINDOW_TYPES.TOOL:
                const toolConfig = getToolConfigById(toolId);
                if (!toolConfig) {
                    console.error("Tool config not found for:", toolId);
                    return;
                }
                title = toolConfig.name || "Tool";
                IconComponent = toolConfig.icon; // Get icon from config
                 // Use specific size from config if available, otherwise default
                 defaultWidth = toolConfig.windowWidth || 800;
                 defaultHeight = toolConfig.windowHeight || 600;
                break;
            default:
                console.error("Unknown window type:", type);
                return;
        }

        // Calculate initial position (e.g., cascade or center)
        const basePos = { x: 100 + (windows.length % 10) * 30, y: 100 + (windows.length % 10) * 30 }; // Basic cascade

        const newWindow = {
            id: newWindowId,
            type,
            toolId: type === WINDOW_TYPES.TOOL ? toolId : null,
            title,
            IconComponent, // Store the icon component itself
            x: initialPosition?.x ?? basePos.x,
            y: initialPosition?.y ?? basePos.y,
            width: initialSize?.width ?? defaultWidth,
            height: initialSize?.height ?? defaultHeight,
            zIndex: newZIndex,
            minimized: false,
        };

        setWindows(prevWindows => [...prevWindows, newWindow]);
    }, [windows, bringToFront]); // Added bringToFront dependency

    const closeWindow = useCallback((id) => {
        setWindows(prevWindows => prevWindows.filter(win => win.id !== id));
        // Optional: Reset z-index counter if no windows are left?
        // if (windows.length === 1) nextZIndex.current = 10;
    }, []);

     const toggleMinimizeWindow = useCallback((id) => {
        setWindows(prevWindows =>
            prevWindows.map(win => {
                if (win.id === id) {
                    if (!win.minimized) {
                        // Minimizing: Keep zIndex but set minimized flag
                        return { ...win, minimized: true };
                    } else {
                        // Restoring: Bring to front
                        const newZIndex = nextZIndex.current++;
                        return { ...win, minimized: false, zIndex: newZIndex };
                    }
                }
                return win;
            })
        );
         // If restoring, bringToFront was handled internally
    }, []);

    const updateWindowPosition = useCallback((id, x, y) => {
        setWindows(prevWindows =>
            prevWindows.map(win =>
                win.id === id ? { ...win, x, y } : win
            )
        );
    }, []);

    const updateWindowSize = useCallback((id, width, height) => {
        setWindows(prevWindows =>
            prevWindows.map(win =>
                win.id === id ? { ...win, width, height } : win
            )
        );
    }, []);

    return (
        <WindowManagerContext.Provider value={{
            windows,
            openWindow,
            closeWindow,
            toggleMinimizeWindow,
            bringToFront,
            updateWindowPosition,
            updateWindowSize,
            WINDOW_TYPES,
            getToolConfigById // Expose helper if needed elsewhere
        }}>
            {children}
        </WindowManagerContext.Provider>
    );
};

export const useWindowManager = () => useContext(WindowManagerContext);