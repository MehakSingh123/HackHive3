// contexts/WindowManagerContext.js
"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react'; // Import useMemo
import { v4 as uuidv4 } from 'uuid';
// Assuming toolsConfig is correctly structured and located
// Adjust the import path if necessary
import { toolsConfig } from "@/public/toolsConfig";

// Define standard window types
export const WINDOW_TYPES = {
    TOOL: 'TOOL',
    AI_CHAT: 'AI_CHAT',
    TERMINAL: 'TERMINAL',
    // Add other window types here if needed
};

// Helper function to get tool config (remains the same)
const getToolConfigById = (toolId) => {
    if (!toolId) return null;
    // Check if toolsConfig and groups exist
    if (!toolsConfig || !toolsConfig.groups) {
        console.error("toolsConfig or toolsConfig.groups is not defined correctly.");
        return null;
    }
    try {
        return Object.values(toolsConfig.groups)
            .flatMap((group) => (group && group.tools ? Object.values(group.tools) : [])) // Add check for group.tools
            .find((tool) => tool && tool.id === toolId); // Add check for tool
    } catch (error) {
        console.error("Error accessing tool configuration:", error);
        return null;
    }
};


const WindowManagerContext = createContext(null);

export const WindowManagerProvider = ({ children }) => {
    const [windows, setWindows] = useState([]);
    const nextZIndex = useRef(10); // Start z-index from 10
    const [commandToRun, setCommandToRun] = useState(null);
    // Helper to get next z-index (memoized)
    const getNextZIndex = useCallback(() => {
        nextZIndex.current += 1; // Increment the ref's current value
        return nextZIndex.current;
    }, []); // No dependencies, ref updates don't trigger re-renders

    // Bring window to front (memoized)
    const bringToFront = useCallback((id) => {
        setWindows(prevWindows => {
            // Check if the window is already at the front based on the ref value
            // This avoids unnecessary state updates if already topmost visible window
            const currentMaxZ = Math.max(1, ...prevWindows.filter(w => !w.minimized).map(w => w.zIndex)); // Min 1 to handle empty array
            const targetWindow = prevWindows.find(w => w.id === id);

            // Only update if not already the topmost window
            if (targetWindow && targetWindow.zIndex < currentMaxZ) {
                 const newZIndex = getNextZIndex(); // Get next z-index
                 console.log(`WindowManager: Bringing window ${id} to front with zIndex ${newZIndex}`);
                 return prevWindows.map(win =>
                    win.id === id ? { ...win, zIndex: newZIndex, minimized: false } : win // Also ensure unminimized
                 );
            } else if (targetWindow && targetWindow.minimized) {
                // If minimized, still bring to front logic applies when unminimizing
                const newZIndex = getNextZIndex();
                console.log(`WindowManager: Unminimizing window ${id} to front with zIndex ${newZIndex}`);
                return prevWindows.map(win =>
                   win.id === id ? { ...win, zIndex: newZIndex, minimized: false } : win
                );
            }
            return prevWindows; // No change needed if already topmost or not found
        });
    }, [getNextZIndex]); // Depends on stable getNextZIndex

    // Toggle minimize window (memoized)
    const toggleMinimizeWindow = useCallback((id) => {
        setWindows(prevWindows =>
            prevWindows.map(win => {
                if (win.id === id) {
                    if (!win.minimized) {
                        // Minimizing: just update minimized flag
                         console.log(`WindowManager: Minimizing window ${id}`);
                        return { ...win, minimized: true };
                    } else {
                        // Unminimizing: bring to front and unminimize
                        const newZIndex = getNextZIndex();
                         console.log(`WindowManager: Unminimizing window ${id} to front with zIndex ${newZIndex}`);
                        return { ...win, minimized: false, zIndex: newZIndex };
                    }
                }
                return win;
            })
        );
    }, [getNextZIndex]); // Depends on stable getNextZIndex

    // Update window position (memoized)
    const updateWindowPosition = useCallback((id, x, y) => {
         // console.log(`WindowManager: Updating position for window ${id} to (${x}, ${y})`); // Can be noisy
        setWindows(prevWindows =>
            prevWindows.map(win =>
                win.id === id ? { ...win, x, y } : win
            )
        );
    }, []); // No dependencies

    // Update window size (memoized)
    const updateWindowSize = useCallback((id, width, height) => {
         // console.log(`WindowManager: Updating size for window ${id} to ${width}x${height}`); // Can be noisy
        setWindows(prevWindows =>
            prevWindows.map(win =>
                win.id === id ? { ...win, width, height } : win
            )
        );
    }, []); // No dependencies

    // Close window (memoized)
    const closeWindow = useCallback((id) => {
         console.log(`WindowManager: Closing window ${id}`);
        setWindows(prevWindows => prevWindows.filter(win => win.id !== id));
    }, []); // No dependencies

    // Open a new window (memoized)
    // Note: This depends on 'windows' state, so it *will* get a new reference when windows array changes.
    // This is generally okay unless passed very deep as a dependency to effects.
    const openWindow = useCallback((windowConfig) => {
        const { type, toolId, initialPosition, initialSize } = windowConfig;
        console.log(`WindowManager: Attempting to open window - Type: ${type}, ToolID: ${toolId || 'N/A'}`);

        // Check if a non-tool window of the same type already exists
        const existingSingletonWindow = type !== WINDOW_TYPES.TOOL
            ? windows.find(win => win.type === type)
            : null;

        // Check if this specific tool window already exists
        const existingToolWindow = type === WINDOW_TYPES.TOOL
            ? windows.find(win => win.toolId === toolId)
            : null;

        const existingWindow = existingSingletonWindow || existingToolWindow;

        if (existingWindow) {
             console.log(`WindowManager: Window already exists (ID: ${existingWindow.id}). Bringing to front.`);
            // If it exists, bring it to front and unminimize it
            // Use bringToFront which handles z-index and minimized state
            bringToFront(existingWindow.id);
            return; // Stop execution
        }

        // If window doesn't exist, create a new one
        const newWindowId = uuidv4();
        const newZIndex = getNextZIndex();
        console.log(`WindowManager: Creating new window ${newWindowId} with zIndex ${newZIndex}`);

        let title = "Window";
        let defaultWidth = 600;
        let defaultHeight = 400;
        let IconComponent = null; // Assuming IconComponent comes from config or is set here

        switch (type) {
            case WINDOW_TYPES.AI_CHAT:
                title = "AI Chat";
                defaultWidth = 500; defaultHeight = 650;
                // IconComponent = ChatIcon; // Example
                break;
            case WINDOW_TYPES.TERMINAL:
                title = "Terminal";
                defaultWidth = 700; defaultHeight = 450;
                // IconComponent = TerminalIcon; // Example
                break;
            case WINDOW_TYPES.TOOL:
                const toolConfig = getToolConfigById(toolId);
                if (!toolConfig) {
                    console.error(`WindowManager: Tool config not found for ID: ${toolId}`);
                    return; // Don't open window if config missing
                }
                title = toolConfig.name || "Tool";
                IconComponent = toolConfig.icon; // Get icon from config
                defaultWidth = toolConfig.windowWidth || 800;
                defaultHeight = toolConfig.windowHeight || 600;
                break;
            default:
                console.error("WindowManager: Unknown window type requested:", type);
                return;
        }

        // Calculate initial position with cascade effect to avoid perfect overlap
        const cascadeOffset = (windows.length % 10) * 30; // Max 10 cascades then wraps
        const basePos = {
            x: 100 + cascadeOffset,
            y: 100 + cascadeOffset
        };

        const newWindow = {
            id: newWindowId,
            type,
            toolId: type === WINDOW_TYPES.TOOL ? toolId : null,
            title,
            IconComponent, // Store the component itself or a reference/name
            x: initialPosition?.x ?? basePos.x,
            y: initialPosition?.y ?? basePos.y,
            width: initialSize?.width ?? defaultWidth,
            height: initialSize?.height ?? defaultHeight,
            zIndex: newZIndex,
            minimized: false
        };

        console.log(`WindowManager: Adding new window:`, newWindow);
        // Correct immutable update: create new array with the new window appended
        setWindows(prevWindows => [...prevWindows, newWindow]);

    }, [windows, bringToFront, getNextZIndex, toggleMinimizeWindow]); // Dependencies for openWindow

    const sendCommandToTerminal = useCallback((command) => {
        console.log("WindowManagerContext: Setting commandToRun -", command.trim());
        // Set state with command and a unique timestamp
        setCommandToRun({ cmd: command, timestamp: Date.now() });
    }, []); // No dependencies needed

    // *** ADDED FUNCTION TO CLEAR COMMAND ***
    const clearCommandToRun = useCallback(() => {
        console.log("WindowManagerContext: Clearing commandToRun.");
        setCommandToRun(null);
    }, []); 

    // *** Memoize the context value object ***
    // This prevents consumers from re-rendering unnecessarily if the provider
    // re-renders but these specific values haven't changed reference.
    const value = useMemo(() => ({
        windows,
        openWindow,
        closeWindow,
        toggleMinimizeWindow,
        bringToFront,
        updateWindowPosition,
        updateWindowSize,
        WINDOW_TYPES,
        getToolConfigById,
        // Add command state and functions
        commandToRun,
        sendCommandToTerminal,
        clearCommandToRun
    }), [
        windows,
        openWindow,
        closeWindow,
        toggleMinimizeWindow,
        bringToFront,
        updateWindowPosition,
        updateWindowSize,
        // Add command state and functions to dependency array
        commandToRun,
        sendCommandToTerminal,
        clearCommandToRun
        // getToolConfigById is stable, WINDOW_TYPES is constant
    ]);
    // *** End Memoization ***


    return (
        <WindowManagerContext.Provider value={value}>
            {children}
        </WindowManagerContext.Provider>
    );
};

// Custom hook to consume the context remains the same
export const useWindowManager = () => {
    const context = useContext(WindowManagerContext);
    if (!context) {
        throw new Error('useWindowManager must be used within a WindowManagerProvider');
    }
    return context;
};