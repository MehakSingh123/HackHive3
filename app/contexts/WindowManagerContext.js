// contexts/WindowManagerContext.js
"use client";

import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid: npm install uuid

const WindowManagerContext = createContext(null);

export const useWindowManager = () => useContext(WindowManagerContext);

// Define initial window types/configs - extend as needed
const WINDOW_TYPES = {
    AI_CHAT: 'AI_CHAT',
    TERMINAL: 'TERMINAL',
    TOOL: 'TOOL', // Generic type for tools from toolsConfig
};

// Default dimensions (can be overridden)
const defaultDimensions = {
    [WINDOW_TYPES.AI_CHAT]: { width: 380, height: 550 },
    [WINDOW_TYPES.TERMINAL]: { width: 700, height: 450 },
    [WINDOW_TYPES.TOOL]: { width: 800, height: 600 }, // Default for tools
};

export const WindowManagerProvider = ({ children }) => {
    const [windows, setWindows] = useState([]);
    const nextZIndex = useRef(10); // Start z-index for windows

    const bringToFront = useCallback((id) => {
        setWindows(prevWindows => {
            const maxZ = Math.max(...prevWindows.map(w => w.zIndex), nextZIndex.current -1) ;
            nextZIndex.current = maxZ + 1;
            return prevWindows.map(w =>
                w.id === id ? { ...w, zIndex: nextZIndex.current } : w
            );
        });
    }, []);

    const openWindow = useCallback(({ type, toolId = null, title, initialPos = null }) => {
        // Prevent opening duplicate non-tool windows (Chat, Terminal)
        if (type === WINDOW_TYPES.AI_CHAT && windows.some(w => w.type === WINDOW_TYPES.AI_CHAT)) {
             const existingWindow = windows.find(w => w.type === WINDOW_TYPES.AI_CHAT);
             if (existingWindow) bringToFront(existingWindow.id);
             return; // Don't open another one
        }
         if (type === WINDOW_TYPES.TERMINAL && windows.some(w => w.type === WINDOW_TYPES.TERMINAL)) {
             const existingWindow = windows.find(w => w.type === WINDOW_TYPES.TERMINAL);
              if (existingWindow) bringToFront(existingWindow.id);
             return; // Don't open another one
        }

        nextZIndex.current += 1;
        const newWindowId = type === WINDOW_TYPES.TOOL ? `${toolId}-${uuidv4()}` : type; // Unique ID for tools

        // Calculate initial position slightly offset for new windows
        const defaultX = 100 + (windows.length % 5) * 30;
        const defaultY = 100 + (windows.length % 5) * 30;

        const newWindow = {
            id: newWindowId,
            type: type,
            toolId: toolId, // Store toolId if it's a tool window
            title: title || (toolId ? toolId : type), // Use toolId or type for title
            x: initialPos?.x ?? defaultX,
            y: initialPos?.y ?? defaultY,
            width: defaultDimensions[type]?.width || defaultDimensions[WINDOW_TYPES.TOOL].width,
            height: defaultDimensions[type]?.height || defaultDimensions[WINDOW_TYPES.TOOL].height,
            zIndex: nextZIndex.current,
            minimized: false,
        };

        setWindows(prev => [...prev, newWindow]);
    }, [windows, bringToFront]); // Added bringToFront dependency

    const closeWindow = useCallback((id) => {
        setWindows(prev => prev.filter(w => w.id !== id));
    }, []);

    const toggleMinimizeWindow = useCallback((id) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, minimized: !w.minimized } : w
        ));
         // If un-minimizing, bring it to front
        const window = windows.find(w => w.id === id);
        if (window && window.minimized) { // Check the *current* state before toggle
             bringToFront(id);
        }
    }, [windows, bringToFront]); // Added dependencies

     const updateWindowPosition = useCallback((id, x, y) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, x, y } : w
        ));
    }, []);

     const updateWindowSize = useCallback((id, width, height) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, width, height } : w
        ));
    }, []);

    const getWindow = (id) => {
        return windows.find(w => w.id === id);
    };

    const getWindowByType = (type) => {
        return windows.find(w => w.type === type);
    }

    const value = {
        windows,
        openWindow,
        closeWindow,
        toggleMinimizeWindow,
        bringToFront,
        updateWindowPosition,
        updateWindowSize,
        getWindow,
        getWindowByType,
        WINDOW_TYPES,
    };

    return (
        <WindowManagerContext.Provider value={value}>
            {children}
        </WindowManagerContext.Provider>
    );
};