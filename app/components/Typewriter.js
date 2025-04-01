// components/Typewriter.js
"use client";

import { useState, useEffect } from 'react';

export default function Typewriter({ text = "", speed = 50, className = "" }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText(''); // Reset when text changes
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (!text || currentIndex >= text.length) {
      return; // Stop typing if text is empty or fully displayed
    }

    const timer = setTimeout(() => {
      setDisplayedText((prev) => prev + text[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer); // Cleanup timer
  }, [text, currentIndex, speed]);

  // Render with a blinking cursor effect
  return (
    <span className={`${className}`}>
      {displayedText}
      <span className="inline-block w-2 h-5 bg-[#00ADEE] ml-1 animate-pulse"></span> {/* Blinking cursor */}
    </span>
  );
}