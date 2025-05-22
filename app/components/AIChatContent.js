// components/AIChatContent.js (Updated for Context API)
"use client";

import React, { useState, useRef, useEffect, useContext, useCallback } from "react"; // Added React/useCallback
import { useAIChat } from "../contexts/AIChatContext"; // Context for getting/sending chat messages
import { Copy, Terminal } from "lucide-react"; // Icons
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // For code blocks
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'; // Syntax highlighting theme
import { useWindowManager } from '../contexts/WindowManagerContext'; // Context for window actions AND sending commands

// --- Removed CommandProcessorContext and eventBus imports ---

export default function AIChatContent() {
    const { messages, addMessage, isLoading } = useAIChat(); // Chat state/actions
    // *** Get sendCommandToTerminal and other needed functions from WindowManagerContext ***
    const { openWindow, WINDOW_TYPES, sendCommandToTerminal } = useWindowManager();
    const [inputMessage, setInputMessage] = useState(""); // User input state
    const messagesEndRef = useRef(null); // Ref to scroll message list

    // Function to format messages, including code blocks with buttons
    const formatMessage = useCallback((content) => {
        // Regex to find code blocks fenced by ```
        const codeBlockRegex = /```([\s\S]*?)```/g;
        const parts = content.split(codeBlockRegex);

        return parts.map((part, index) => {
            // Code blocks appear at odd indices after split
            if (index % 2 === 1) {
                // Extract language hint (optional) and code content
                const langAndCode = part.split('\n');
                // Assume first line is language, default to 'bash', normalize case
                const language = langAndCode[0].trim().toLowerCase() || 'bash';
                // Join remaining lines as code, trim whitespace
                const code = langAndCode.slice(1).join('\n').trim();

                // --- Handler specifically for the "Execute in Terminal" button ---
                const handleExecuteInTerminal = () => {
                    if (!code) return; // Don't run empty code
                    console.log(`AI Chat: Requesting terminal run via context for command: ${code}`);

                    // 1. Ensure terminal window is open and potentially focused
                    // This uses the function from WindowManagerContext
                    openWindow({ type: WINDOW_TYPES.TERMINAL, title: 'Terminal' });

                    // 2. *** Call context function to send command ***
                    // Add newline (\n) so the shell executes the command
                    // A small delay can sometimes help ensure the terminal window
                    // has focus or its listener is ready, but ideally the listener handles readiness.
                    setTimeout(() => {
                         try {
                             sendCommandToTerminal(code + '\n');
                             console.log("AI Chat: sendCommandToTerminal called via context.");
                         } catch (error) {
                              console.error("AI Chat: Error calling sendCommandToTerminal:", error);
                              // Optional: Show error feedback to user?
                         }
                    }, 300); // 300ms delay (adjust or remove if unnecessary)
                };
                // --- End handler ---

                // Render the code block with SyntaxHighlighter and buttons
                return (
                    <div key={index} className="relative group my-2">
                        <SyntaxHighlighter
                            language={language}
                            style={vscDarkPlus}
                            className="rounded-md p-3 text-sm border border-gray-700 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                            customStyle={{ margin: 0, background: '#1e1e1e', maxHeight: '300px', overflow: 'auto' }}
                            wrapLongLines={true}
                            PreTag="div"
                        >
                            {code}
                        </SyntaxHighlighter>
                        {/* Buttons appear on hover */}
                        <div className="absolute top-1.5 right-1.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => navigator.clipboard.writeText(code)}
                                className="p-1 bg-[#0A2540]/80 rounded hover:bg-[#081A2C]/90 border border-[#00ADEE]/30"
                                title="Copy code"
                            >
                                <Copy size={12} className="text-[#00ADEE]" />
                            </button>
                            <button
                                onClick={handleExecuteInTerminal} // Use the handler defined above
                                className="p-1 bg-[#0A2540]/80 rounded hover:bg-[#081A2C]/90 border border-[#00ADEE]/30"
                                title="Execute in terminal"
                            >
                                <Terminal size={12} className="text-[#00ADEE]" />
                            </button>
                        </div>
                    </div>
                );
            }

            // --- Render regular text parts ---
            // Basic link detection (can be improved)
             const linkRegex = /(https?:\/\/[^\s"'>]+)/g;
             const textParts = part.split(linkRegex);
             return (
                 <p key={index} className="whitespace-pre-wrap break-words">
                     {textParts.map((textPart, textIndex) =>
                         linkRegex.test(textPart) ? (
                             <a
                                 key={textIndex}
                                 href={textPart}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-blue-400 hover:text-blue-300 underline"
                             >
                                 {textPart}
                             </a>
                         ) : (
                             textPart // Render non-link text normally
                         )
                     )}
                 </p>
             );
        });
    // Dependencies for useCallback: include functions/values read from context/props used inside
    }, [openWindow, WINDOW_TYPES, sendCommandToTerminal]);


    // Function to scroll messages to the bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Effect to scroll when new messages arrive
    useEffect(scrollToBottom, [messages]);

    // Handle form submission (sending message to AI via context)
    const handleSendMessage = (e) => {
        e.preventDefault();
        const messageToSend = inputMessage.trim();
        if (messageToSend && !isLoading) {
            addMessage(messageToSend); // Assumes addMessage in context handles sending to backend AI
            setInputMessage(""); // Clear input field
        }
    }

    // --- Component Return JSX ---
    return (
        <div className="flex flex-col h-full text-white text-sm select-text bg-[#0A0F14] p-1">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-[#00ADEE]/40 scrollbar-track-transparent scrollbar-thumb-rounded">
                {messages.map((msg, i) => (
                    // Message bubble rendering
                    <div
                        key={msg.id || i} // Use unique message ID from context if available
                        className={`p-2.5 rounded-lg max-w-[90%] ${msg.role === "user"
                                ? "bg-[#00ADEE]/10 border border-[#00ADEE]/20 ml-auto" // User message style
                                : "bg-[#0A2540]/70 border border-[#081A2C]/50 mr-auto" // AI message style
                            } transition-all`}
                    >
                        {/* Message content formatting */}
                        <div className="text-sm text-gray-200 leading-relaxed">
                           {formatMessage(msg.content)}
                        </div>
                    </div>
                ))}
                {/* Loading indicator for AI response */}
                {isLoading && (
                    <div className="p-3 rounded-lg bg-[#0A2540]/70 border border-[#081A2C] w-max mr-auto">
                         <div className="animate-pulse flex items-center gap-2">
                             <div className="h-2 w-2 bg-[#00ADEE]/70 rounded-full"></div>
                             <div className="h-2 w-2 bg-[#00ADEE]/70 rounded-full animation-delay-200" style={{animationDelay: '0.2s'}}></div>
                             <div className="h-2 w-2 bg-[#00ADEE]/70 rounded-full animation-delay-400" style={{animationDelay: '0.4s'}}></div>
                         </div>
                    </div>
                )}
                {/* Empty div to help scroll to bottom */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-2 border-t border-[#00ADEE]/20 mt-1">
                <div className="relative">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask HiveMind AI..."
                        className="w-full bg-[#081A2C]/80 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#00ADEE] border border-[#00ADEE]/30 text-gray-100 placeholder-gray-500"
                        disabled={isLoading}
                        aria-label="Chat input"
                    />
                    <button
                        type="submit"
                        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-[#00ADEE] hover:text-white bg-[#0A2540]/80 p-1 rounded disabled:opacity-50 transition-opacity"
                        disabled={isLoading || !inputMessage.trim()}
                        title="Send message"
                        aria-label="Send message"
                    >
                        {/* Send Icon */}
                        <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </form>
        </div>
    );
}