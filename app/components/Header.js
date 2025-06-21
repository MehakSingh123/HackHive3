"use client";

import { useState, useEffect } from "react";
import { TerminalSquare, Clock, LogOut } from "lucide-react";
import Link from "next/link";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../page.js";

export default function Header() {
  const [currentTime, setCurrentTime] = useState("");
  const [user, setUser] = useState(null);
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const updateTime = () => {
      try {
        setCurrentTime(
          new Date().toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch (e) {
        setCurrentTime(
          new Date().toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-[#081A2C] shadow-lg py-3 px-6 flex items-center justify-between z-20 border-b border-[#00ADEE]/30 relative">
      <Link href="/" className="flex items-center space-x-3 cursor-pointer group">
        <div className="text-[#00ADEE] group-hover:animate-pulse">
          <TerminalSquare size={28} strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-white">
          Hack<span className="text-[#00ADEE]">Hive</span>
        </h1>
      </Link>

      <div className="flex items-center space-x-6">
        <div className="flex items-center gap-2 text-sm text-cyan-300 font-mono">
          <Clock size={16} />
          <span>{currentTime || "..."}</span>
        </div>

        {user && !user.isAnonymous && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors font-mono"
            aria-label="Logout"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}