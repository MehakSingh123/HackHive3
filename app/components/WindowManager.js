"use client";
import React from 'react';
import { useWindowManager } from '../contexts/WindowManagerContext';
import Window from './Window';
import { AnimatePresence, motion } from 'framer-motion';

const WindowManager = () => {
    const { windows } = useWindowManager();

    // Animation variants for windows
    const windowVariants = {
        initial: {
            opacity: 0,
            scale: 0.95
        },
        animate: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.2
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
                duration: 0.15
            }
        }
    };

    // Get visible windows
    const visibleWindows = windows.filter(win => !win.minimized);

    return (
        <div className="window-manager-area fixed inset-0 overflow-hidden pointer-events-none">
            <AnimatePresence>
                {visibleWindows.map(winData => (
                    <motion.div
                        key={winData.id}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={windowVariants}
                        className="pointer-events-auto"
                    >
                        <Window windowData={winData} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default WindowManager;