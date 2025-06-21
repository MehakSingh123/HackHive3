'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInAnonymously,
    signInWithCustomToken
} from 'firebase/auth';
import { Bot, ArrowRight } from 'lucide-react';
import EthicalHackingStages from './components/EthicalHackingStages';

export const firebaseConfig = {
  apiKey: "AIzaSyAbx1md1JwRdCFJlujCiyQUXl6F0trLw8M",
  authDomain: "hackhive-6a0d3.firebaseapp.com",
  projectId: "hackhive-6a0d3",
  storageBucket: "hackhive-6a0d3.firebasestorage.app",
  messagingSenderId: "925721491531",
  appId: "1:925721491531:web:6396834acf4d4ba6ae75ce",
  measurementId: "G-0E52TRLEXK"
};


const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Simple Placeholder Components ---
// These are included to prevent import errors. You can replace them with your actual components.
function SplashScreen({ onFinished }) {
    useEffect(() => {
        const timer = setTimeout(() => onFinished(), 1500);
        return () => clearTimeout(timer);
    }, [onFinished]);
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading Application...</div>;
}

function Typewriter({ text }) {
    return <span>{text}</span>;
}




// --- Authentication Component ---
function AuthComponent() {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-2xl">
                <h1 className="text-3xl font-bold text-center text-white">
                    {isLoginMode ? 'Welcome to HackHive' : 'Create Your Account'}
                </h1>
                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
                        <input
                            id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                            className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
                        <input
                            id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                            className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="••••••••"
                        />
                    </div>
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                            {loading ? 'Processing...' : (isLoginMode ? 'Login' : 'Sign Up')}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-center text-gray-400">
                    {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
                    <button onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="ml-2 font-medium text-indigo-400 hover:text-indigo-300">
                        {isLoginMode ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}


// --- Main Page Component ---
export default function HomePage() {
    const [user, setUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [showSplash, setShowSplash] = useState(false);
    const [aiIntroText, setAiIntroText] = useState("");
    const [isAiTextLoading, setIsAiTextLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const splashShown = localStorage.getItem('splashScreenShown');
            if (!splashShown) {
                setShowSplash(true);
                localStorage.setItem('splashScreenShown', 'true');
            }
        }
        
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthReady(true);
        });

        if (initialAuthToken) {
            signInWithCustomToken(auth, initialAuthToken).catch(() => signInAnonymously(auth));
        } else if (!auth.currentUser) {
            signInAnonymously(auth);
        }

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!showSplash && authReady && user) {
            setIsAiTextLoading(true);
            const fetchAiIntro = async () => {
                try {
                    const prompt = `Generate a cool and engaging introductory paragraph (around 50-70 words) for the HackHive platform's homepage. HackHive provides a safe virtual environment with tools like Nmap and a Kali Linux terminal for cybersecurity practice and ethical hacking. Mention the focus on hands-on learning and security exploration. Use a slightly technical but exciting tone suitable for security enthusiasts. Start directly with the introduction, no greetings needed.`;
                    const res = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
                    });
                    if (!res.ok) throw new Error(`AI server responded with status ${res.status}`);
                    const data = await res.json();
                    setAiIntroText(data.content || "Welcome to HackHive - explore responsibly.");
                } catch (error) {
                    setAiError("Could not load dynamic introduction. Welcome to HackHive!");
                    setAiIntroText("HackHive offers a dynamic platform for cybersecurity exploration. Dive into virtual labs, utilize essential tools, and hone your ethical hacking skills in a controlled environment.");
                } finally {
                    setIsAiTextLoading(false);
                }
            };
            fetchAiIntro();
        }
    }, [showSplash, authReady, user]);

    if (showSplash) {
        return <SplashScreen onFinished={() => setShowSplash(false)} />;
    }

    if (!authReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                Loading...
            </div>
        );
    }
    
    // User not logged in with an email, show Auth form.
    if (!user || user.isAnonymous) {
        return <AuthComponent />;
    }

    // User is logged in, show the main homepage content.
    return (
        <motion.div
            className="w-full px-6 py-8 md:px-12 md:py-10 text-white bg-gradient-to-b from-[#081A2C] via-[#0A2540] to-[#0A2540] min-h-[calc(100vh-var(--header-height))] flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        >
            <header className="text-center mb-12 md:mb-16">
                <motion.h1
                    className="text-4xl md:text-6xl font-bold mb-4"
                    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
                >
                    Welcome to Hack<span className="text-[#00ADEE]">Hive</span>
                </motion.h1>
                <motion.p
                    className="text-lg md:text-xl text-blue-200 max-w-3xl mx-auto font-mono"
                    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
                >
                    Your Integrated Security Simulation Environment.
                </motion.p>
            </header>

            <section className="mb-12 md:mb-16 bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-[#00ADEE] mb-4 flex items-center gap-2">
                    <Bot size={24} /> Platform Overview
                </h2>
                <div className="text-gray-300 text-base md:text-lg leading-relaxed font-mono min-h-[50px]">
                    {isAiTextLoading ? (
                        <span className="flex items-center gap-2"><div className="w-2 h-5 bg-gray-500 animate-pulse"></div> Generating insights...</span>
                    ) : aiError ? (
                        <span className="text-yellow-400">{aiError}</span>
                    ) : (
                        <Typewriter text={aiIntroText} />
                    )}
                </div>
            </section>

            <section className="mb-12 md:mb-16">
                <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-[#00ADEE]">Explore the Hacking Lifecycle</h2>
                <p className="text-center text-gray-400 mb-10 md:mb-12 max-w-2xl mx-auto font-mono text-sm md:text-base">
                    Click on a stage to expand it and learn more about its purpose and common tools used in ethical hacking engagements within HackHive.
                </p>
                <EthicalHackingStages />
            </section>

            <section className="mt-auto text-center pt-8">
                <a href="/tools">
                    <motion.button
                        className="bg-[#00ADEE] hover:bg-[#0090C5] text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-300 inline-flex items-center gap-2 shadow-lg"
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1}} transition={{ delay: 0.8 }}
                    >
                        Explore Security Tools <ArrowRight size={20} />
                    </motion.button>
                </a>
            </section>
        </motion.div>
    );
}
