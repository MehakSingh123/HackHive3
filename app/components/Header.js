// components/Header.js
"use client";

import { useState, useEffect } from "react";
import { TerminalSquare, Zap, Clock } from "lucide-react"; // Replaced Server icons with Clock
import Link from "next/link";

export default function Header() {
  const [currentTime, setCurrentTime] = useState("");

  // Effect for Clock
  useEffect(() => {
    // Function to update time
    const updateTime = () => {
      // Using IST timezone specifically as per context, fallback to local if error
      try {
        setCurrentTime(
          new Date().toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
          })
        ); // Use IST
      } catch (e) {
        console.warn("Could not use specific timezone, using local.", e);
        setCurrentTime(
          new Date().toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
          })
        ); // Fallback
      }
    };

    updateTime(); // Initial update
    const intervalId = setInterval(updateTime, 1000); // Update every second

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means run once on mount

  return (
    <header className="bg-[#081A2C] shadow-lg py-3 px-6 flex items-center justify-between z-20 border-b border-[#00ADEE]/30 relative">
      {/* Left Side: Logo and Brand */}
      <Link
        href="/"
        className="flex items-center space-x-3 cursor-pointer group"
      >
        <div className="text-[#00ADEE] group-hover:animate-pulse">
          <TerminalSquare size={28} strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-white">
          Hack<span className="text-[#00ADEE]">Hive</span>
        </h1>
      </Link>

      {/* Right Side: AI Tip and Clock */}
      <div className="flex items-center space-x-6">
        {/* Current Time */}
        <div className="flex items-center gap-2 text-sm text-cyan-300 font-mono">
          <span>{currentTime || "Loading..."}</span> {/* Display the time */}
        </div>
      </div>
    </header>
  );
}
