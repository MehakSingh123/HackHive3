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
            scale: 0.9,
            y: 20
        },
        animate: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 20
            }
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            y: 20,
            transition: {
                duration: 0.2
            }
        }
    };

    // Get visible windows
    const visibleWindows = windows.filter(win => !win.minimized);

    return (
        <div className="window-manager-area fixed inset-0 overflow-hidden pointer-events-none">
            {/* Using AnimatePresence for smooth animations */}
            <AnimatePresence>
                {visibleWindows.map(winData => (
                    <motion.div
                        key={winData.id}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={windowVariants}
                        className="pointer-events-auto"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    >
                        <Window windowData={winData} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default WindowManager;