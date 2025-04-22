// components/LinuxDesktopLayout.js
"use client";

import Taskbar from "./Taskbar";
import Window from "./Window"; // Import the Window component
import { useWindowManager } from '../contexts/WindowManagerContext'; // Import window manager

export default function LinuxDesktopLayout({ children }) { // children might be unused now or hold desktop icons later
    const { windows } = useWindowManager();

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-[#0d1a2b] via-[#081A2C] to-[#05111d] text-white overflow-hidden">
            {/* Optional: Desktop Wallpaper */}
             {/* <div className="absolute inset-0 bg-[url('/img/kali-linux-wallpaper.jpg')] bg-cover bg-center opacity-30 z-0"></div> */}

            {/* Main Desktop Area - acts as bounds for windows */}
            <main className="flex-1 relative overflow-hidden z-10">
                {/* Render Desktop Icons Here - Future Enhancement */}
                 {/* {children} */}

                 {/* Render Open Windows */}
                 {windows.map((winData) => (
                     // Only render if not minimized, Window component itself handles this check now
                     <Window key={winData.id} windowData={winData} />
                 ))}
            </main>

            {/* Taskbar */}
            <Taskbar />
        </div>
    );
}