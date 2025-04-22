// components/AIChatContent.js (New - Extracted from AIChat.js)
"use client";
import { useState, useRef, useEffect, useContext } from "react";
import { useAIChat } from "../contexts/AIChatContext"; // Keep using its message logic
import { Copy, Terminal } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { CommandProcessorContext } from "../contexts/CommandProcessorContext";
import { useWindowManager } from '../contexts/WindowManagerContext'; // To open Terminal window

export default function AIChatContent() {
    const { messages, addMessage, isLoading } = useAIChat();
    const { processCommand } = useContext(CommandProcessorContext);
    const { openWindow, WINDOW_TYPES } = useWindowManager(); // Use window manager to open terminal
    const [inputMessage, setInputMessage] = useState("");
    const messagesEndRef = useRef(null);

    // --- formatMessage, scrollToBottom, useEffect for scroll (Keep as is from original AIChat.js) ---
    const formatMessage = (content) => {
      const codeBlockRegex = /```([\s\S]*?)```/g;
      const parts = content.split(codeBlockRegex);

      return parts.map((part, index) => {
        if (index % 2 === 1) {
          const langAndCode = part.split('\n');
          const language = langAndCode[0].trim(); // Assume first line is language hint
          const code = langAndCode.slice(1).join('\n').trim();
          return (
            <div key={index} className="relative group my-2">
              <SyntaxHighlighter
                language={language || 'bash'}
                style={vscDarkPlus}
                className="rounded-md p-3 text-sm border border-gray-700"
                customStyle={{ margin: 0, background: '#1e1e1e' }} // Consistent background
                 wrapLongLines={true}
              >
                {code}
              </SyntaxHighlighter>
              <div className="absolute top-1.5 right-1.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="p-1 bg-[#0A2540]/80 rounded hover:bg-[#081A2C]/90 border border-[#00ADEE]/30"
                  title="Copy code"
                >
                  <Copy size={12} className="text-[#00ADEE]" />
                </button>
                <button
                  onClick={() => {
                      // Open terminal window first, then process command
                      openWindow({ type: WINDOW_TYPES.TERMINAL, title: 'Terminal' });
                      // Small delay to ensure terminal context might be ready (can be improved)
                      setTimeout(() => processCommand(code), 200);
                  }}
                  className="p-1 bg-[#0A2540]/80 rounded hover:bg-[#081A2C]/90 border border-[#00ADEE]/30"
                  title="Execute in terminal"
                >
                  <Terminal size={12} className="text-[#00ADEE]" />
                </button>
              </div>
            </div>
          );
        }
        // Ensure non-code text wraps correctly
        return <p key={index} className="whitespace-pre-wrap break-words">{part}</p>;
      });
    };

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    // --- End of kept logic ---


    // No Rnd, no visibility toggle button needed here
    return (
        <div className="flex flex-col h-full text-white text-sm select-text bg-[#0A0F14] p-1">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-[#00ADEE]/40 scrollbar-track-transparent scrollbar-thumb-rounded">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`p-2.5 rounded-lg max-w-[90%] ${msg.role === "user"
                                ? "bg-[#00ADEE]/10 border border-[#00ADEE]/20 ml-auto"
                                : "bg-[#0A2540]/70 border border-[#081A2C]/50 mr-auto"
                            } transition-all`}
                    >
                        <div className="text-sm text-gray-200 leading-relaxed">
                           {formatMessage(msg.content)}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="p-3 rounded-lg bg-[#0A2540]/70 border border-[#081A2C] w-max mr-auto">
                        <div className="animate-pulse flex items-center gap-2">
                            <div className="h-2 w-2 bg-[#00ADEE]/70 rounded-full"></div>
                            <div className="h-2 w-2 bg-[#00ADEE]/70 rounded-full animation-delay-200"></div>
                            <div className="h-2 w-2 bg-[#00ADEE]/70 rounded-full animation-delay-400"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (inputMessage.trim() && !isLoading) {
                        addMessage(inputMessage.trim());
                        setInputMessage("");
                    }
                }}
                className="p-2 border-t border-[#00ADEE]/20 mt-1"
            >
                <div className="relative">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask HiveMind AI..."
                        className="w-full bg-[#081A2C]/80 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#00ADEE] border border-[#00ADEE]/30 text-gray-100 placeholder-gray-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-[#00ADEE] hover:text-white bg-[#0A2540]/80 p-1 rounded disabled:opacity-50"
                        disabled={isLoading || !inputMessage.trim()}
                        title="Send message"
                    >
                         <span>↵</span>
                    </button>
                </div>
            </form>
        </div>
    );
}