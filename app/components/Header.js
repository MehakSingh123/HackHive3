// components/Header.js
"use client";

import { useState, useEffect } from 'react';
import { TerminalSquare, Zap, Clock } from 'lucide-react'; // Replaced Server icons with Clock
import Link from 'next/link';
// Removed VMContext import as it's no longer used here

const AI_TIP_CACHE_KEY = 'hackhive_ai_header_tip';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // Cache tip for 24 hours

export default function Header() {
  const [aiTip, setAiTip] = useState('');
  const [isTipLoading, setIsTipLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Effect for AI Tip (keeps previous caching logic)
  useEffect(() => {
    const getAiTip = async () => {
      const cachedData = localStorage.getItem(AI_TIP_CACHE_KEY);
      const now = Date.now();
      let tip = '';
      let fetchNew = true;

      if (cachedData) {
        try {
          const { text, timestamp } = JSON.parse(cachedData);
          if (text && timestamp && now - timestamp < CACHE_DURATION_MS) {
            tip = text;
            fetchNew = false;
          } else {
            localStorage.removeItem(AI_TIP_CACHE_KEY);
          }
        } catch (e) {
          console.error("Failed to parse cached AI tip", e);
          localStorage.removeItem(AI_TIP_CACHE_KEY);
        }
      }

      if (fetchNew) {
        setIsTipLoading(true);
        try {
          const prompt = `Generate a very short,fun, thematic message for the header of a cybersecurity simulation platform called HackHive. It could be a fictional system status, a concise security tip, or a brief alert. Keep it under 15 words and engaging for ethical hackers/security students. Example: "Network anomaly detected in Zone 4." or "Tip: Always sanitize user input!"`;
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
          });
          if (!res.ok) { throw new Error(`AI service responded with status ${res.status}`); }
          const data = await res.json();
          tip = data.content || "System monitoring active.";
          localStorage.setItem(AI_TIP_CACHE_KEY, JSON.stringify({ text: tip, timestamp: now }));
        } catch (error) {
          console.error("Failed to fetch AI header tip:", error);
          tip = "System monitoring active.";
        } finally {
          setIsTipLoading(false);
        }
      }
      setAiTip(tip);
    };
    getAiTip();
  }, []);

  // Effect for Clock
  useEffect(() => {
    // Function to update time
    const updateTime = () => {
       // Using IST timezone specifically as per context, fallback to local if error
        try {
             setCurrentTime(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })); // Use IST
        } catch (e) {
             console.warn("Could not use specific timezone, using local.", e);
             setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: false })); // Fallback
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
      <Link href="/" className="flex items-center space-x-3 cursor-pointer group">
        <div className="text-[#00ADEE] group-hover:animate-pulse">
          <TerminalSquare size={28} strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-white">
          Hack<span className="text-[#00ADEE]">Hive</span>
        </h1>
      </Link>

      {/* Right Side: AI Tip and Clock */}
      <div className="flex items-center space-x-6">
        {/* AI Generated Tip / Status */}
        <div className="flex items-center gap-2 text-sm text-gray-300 font-mono">
          <Zap size={16} className="text-yellow-400 flex-shrink-0" />
          <span className="hidden md:inline">
            {isTipLoading ? (
              <span className="italic text-gray-500">Loading brief...</span>
            ) : (
              aiTip
            )}
          </span>
        </div>

        {/* Current Time */}
        <div className="flex items-center gap-2 text-sm text-cyan-300 font-mono">
          <Clock size={16} className="flex-shrink-0" />
          <span>{currentTime || 'Loading...'}</span> {/* Display the time */}
        </div>
      </div>
    </header>
  );
}