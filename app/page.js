// app/page.js
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SplashScreen from './components/SplashScreen'; // Adjust path if needed
import Typewriter from './components/Typewriter'; // Adjust path if needed
import EthicalHackingStages from './components/EthicalHackingStages'; // Ensure this path is correct
import { Bot, ArrowRight } from 'lucide-react'; // Keep used icons

export default function HomePage() {
    const [showSplash, setShowSplash] = useState(false); // Keep splash screen logic
    const [aiIntroText, setAiIntroText] = useState("");
    const [isAiTextLoading, setIsAiTextLoading] = useState(false);
    const [aiError, setAiError] = useState(null);

    // --- Splash Screen Logic (Keep As Is) ---
    useEffect(() => {
        let shouldShowSplash = false;
        if (typeof window !== 'undefined') {
            const splashShown = localStorage.getItem('splashScreenShown');
            if (splashShown === null) {
                shouldShowSplash = true;
                localStorage.setItem('splashScreenShown', 'true');
            }
        }
        setShowSplash(shouldShowSplash);
    }, []);

    // --- AI Intro Text Fetch Logic (Keep As Is) ---
    useEffect(() => {
        if (!showSplash) {
            setIsAiTextLoading(true);
            setAiError(null);

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
    }, [showSplash]);

    if (showSplash) {
        return <SplashScreen onFinished={() => setShowSplash(false)} />;
    }

    // --- Main Homepage Content ---
    return (
        <motion.div
            // Use min-h-screen and flex to ensure footer button is pushed down even if content is short
            className="w-full px-6 py-8 md:px-12 md:py-10 text-white bg-gradient-to-b from-[#081A2C] via-[#0A2540] to-[#0A2540] min-h-screen flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Hero Section (Keep As Is) */}
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

            {/* AI Generated Intro Section (Keep As Is) */}
            <section className="mb-12 md:mb-16 bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-6 shadow-lg max-w-5xl mx-auto w-full">
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

            {/* Interactive Hacking Stages Section (Keep As Is) */}
            <section className="mb-12 md:mb-16">
                <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-[#00ADEE]">Explore the Hacking Lifecycle</h2>
                <p className="text-center text-gray-400 mb-10 md:mb-12 max-w-2xl mx-auto font-mono text-sm md:text-base">
                    Click on a stage to expand it and learn more about its purpose and common tools used in ethical hacking engagements within HackHive.
                </p>
                <EthicalHackingStages /> {/* Render the component */}
            </section>

            {/* Call to Action Section *** UPDATED LINK AND TEXT *** */}
            <section className="mt-auto text-center pt-8 pb-4"> {/* Added pb-4 for spacing */}
                {/* Link now points to /desktop */}
                <Link href="/desktop">
                    <motion.button
                        className="bg-[#00ADEE] hover:bg-[#0090C5] text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-300 inline-flex items-center gap-2 shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    >
                        {/* Updated button text */}
                        Launch Security Desktop <ArrowRight size={20} />
                    </motion.button>
                </Link>
            </section>

        </motion.div>
    );
}