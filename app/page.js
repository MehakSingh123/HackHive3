// app/page.js
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SplashScreen from './components/SplashScreen'; // Adjust path if needed
import Typewriter from './components/Typewriter'; // Adjust path if needed
import { Bot, Terminal, ShieldCheck, Wrench, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(false);
  const [aiIntroText, setAiIntroText] = useState("");
  const [isAiTextLoading, setIsAiTextLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Check if splash screen has been shown before
  useEffect(() => {
    // Initialize with false (don't show splash) by default
    let shouldShowSplash = false;
    
    // Check if we're in a browser environment (to avoid SSR issues)
    if (typeof window !== 'undefined') {
      // Check localStorage for splash screen flag
      const splashShown = localStorage.getItem('splashScreenShown');
      
      // If splashShown is null (first visit), we should show the splash
      if (splashShown === null) {
        shouldShowSplash = true;
        // Set the flag in localStorage
        localStorage.setItem('splashScreenShown', 'true');
      }
    }
    
    setShowSplash(shouldShowSplash);
  }, []);

  // Fetch AI-generated intro text after splash screen finishes or if splash is skipped
  useEffect(() => {
    // Only fetch when component mounts or splash is hidden
    if (!showSplash) {
      setIsAiTextLoading(true);
      setAiError(null); // Reset error

      const fetchAiIntro = async () => {
        try {
          const prompt = `Generate a cool and engaging introductory paragraph (around 50-70 words) for the HackHive platform's homepage. HackHive provides a safe virtual environment with tools like Nmap and a Kali Linux terminal for cybersecurity practice and ethical hacking. Mention the focus on hands-on learning and security exploration. Use a slightly technical but exciting tone suitable for security enthusiasts. Start directly with the introduction, no greetings needed.`;

          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
          });

          if (!res.ok) {
            throw new Error(`AI server responded with status ${res.status}`);
          }
          const data = await res.json();
          setAiIntroText(data.content || "Welcome to HackHive - explore responsibly.");

        } catch (error) {
          console.error("Failed to fetch AI intro:", error);
          setAiError("Could not load dynamic introduction. Welcome to HackHive!");
          setAiIntroText("HackHive offers a dynamic platform for cybersecurity exploration. Dive into virtual labs, utilize essential tools, and hone your ethical hacking skills in a controlled environment."); // Fallback text
        } finally {
          setIsAiTextLoading(false);
        }
      };

      fetchAiIntro();
    }
  }, [showSplash]); // Dependency array includes showSplash

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  // Main Homepage Content
  return (
    <motion.div
      className="w-full px-6 py-8 md:px-12 md:py-10 text-white bg-gradient-to-b from-[#081A2C] via-[#0A2540] to-[#0A2540] min-h-[calc(100vh-var(--header-height))] flex flex-col" // Adjust min-height based on actual header height if needed
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <header className="text-center mb-12 md:mb-16">
        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Welcome to Hack<span className="text-[#00ADEE]">Hive</span>
        </motion.h1>
        <motion.p
            className="text-lg md:text-xl text-blue-200 max-w-3xl mx-auto font-mono"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            Your Integrated Security Simulation Environment.
        </motion.p>
      </header>

      {/* AI Generated Intro Section */}
      <section className="mb-12 md:mb-16 bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-semibold text-[#00ADEE] mb-4 flex items-center gap-2">
          <Bot size={24} /> Platform Overview
        </h2>
        <div className="text-gray-300 text-base md:text-lg leading-relaxed font-mono min-h-[50px]">
          {isAiTextLoading ? (
            <span className="flex items-center gap-2"> <div className="w-2 h-5 bg-gray-500 animate-pulse"></div> Generating insights...</span>
          ) : aiError ? (
            <span className="text-yellow-400">{aiError}</span>
          ) : (
            <Typewriter text={aiIntroText} speed={30} />
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-12 md:mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-[#00ADEE]">Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Feature Card 1 */}
          <motion.div
            className="bg-[#0A2540]/70 p-6 rounded-lg border border-gray-700/50 hover:border-[#00ADEE]/50 transition-colors duration-300"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
           >
            <ShieldCheck size={32} className="text-[#00ADEE] mb-3" />
            <h3 className="text-xl font-semibold mb-2 text-white">Virtual Labs</h3>
            <p className="text-gray-400 text-sm">Isolated Kali Linux environment powered by Docker. Start, stop, and execute commands safely.</p>
          </motion.div>
          {/* Feature Card 2 */}
          <motion.div
            className="bg-[#0A2540]/70 p-6 rounded-lg border border-gray-700/50 hover:border-[#00ADEE]/50 transition-colors duration-300"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            >
            <Wrench size={32} className="text-[#00ADEE] mb-3" />
            <h3 className="text-xl font-semibold mb-2 text-white">Integrated Tools</h3>
            <p className="text-gray-400 text-sm">Access essential security tools like Nmap directly through a user-friendly interface, powered by your VM.</p>
          </motion.div>
          {/* Feature Card 3 */}
          <motion.div
            className="bg-[#0A2540]/70 p-6 rounded-lg border border-gray-700/50 hover:border-[#00ADEE]/50 transition-colors duration-300"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            >
            <Terminal size={32} className="text-[#00ADEE] mb-3" />
            <h3 className="text-xl font-semibold mb-2 text-white">Web Terminal</h3>
            <p className="text-gray-400 text-sm">Real-time interaction with your virtual machine via a persistent WebSocket-based terminal.</p>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
       <section className="mt-auto text-center pt-8"> {/* Pushes to bottom if content is short */}
            <Link href="/tools">
                <motion.button
                    className="bg-[#00ADEE] hover:bg-[#0090C5] text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-300 inline-flex items-center gap-2 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                     initial={{ opacity: 0 }} animate={{ opacity: 1}} transition={{ delay: 0.8 }}
                >
                    Explore Security Tools <ArrowRight size={20} />
                </motion.button>
            </Link>
        </section>

    </motion.div>
  );
}