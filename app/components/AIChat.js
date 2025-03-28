// components/AIChat.js
"use client";
import { useState, useRef, useEffect, useContext } from "react";
import { useAIChat } from "../contexts/AIChatContext";
import { MessageSquare, X, Pin, Copy, Terminal } from "lucide-react";
import { Rnd } from "react-rnd";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { CommandProcessorContext } from "../contexts/CommandProcessorContext";
import { TerminalContext } from "../contexts/TerminalContext";

export default function AIChat() {
  const { 
    chatVisible, 
    setChatVisible,
    messages,
    addMessage,
    isLoading,
    isPinned,
    setIsPinned,
  } = useAIChat();
    
    const {processCommand} = useContext(CommandProcessorContext)
    const {setTerminalVisible} = useContext(TerminalContext)
  
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const formatMessage = (content) => {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const [language, ...code] = part.split('\n');
        return (
          <div key={index} className="relative group">
            <SyntaxHighlighter 
              language={language || 'bash'} 
              style={vscDarkPlus}
              className="rounded-lg p-4 my-2 text-sm"
            >
              {code.join('\n').trim()}
            </SyntaxHighlighter>
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => navigator.clipboard.writeText(code.join('\n').trim())}
                className="p-1 bg-gray-700 rounded hover:bg-gray-600"
                title="Copy code"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => {
                  setTerminalVisible(true);
                  processCommand(code.join('\n').trim());
                }}
                className="p-1 bg-gray-700 rounded hover:bg-gray-600"
                title="Execute in terminal"
              >
                <Terminal size={14} />
              </button>
            </div>
          </div>
        );
      }
      return <p key={index} className="whitespace-pre-wrap">{part}</p>;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  if (!chatVisible) return (
    <button
      onClick={() => setChatVisible(true)}
      className="fixed bottom-6 right-24 bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-full shadow-lg z-30 transition-all active:scale-95"
      title="Open AI Chat"
    >
      <MessageSquare size={24} />
    </button>
  );

  return (
    <Rnd
      default={{
        x: window.innerWidth - 400,
        y: window.innerHeight - 500,
        width: 350,
        height: 500
      }}
      minWidth={300}
      minHeight={400}
      disableDragging={isPinned}
      enableUserSelectHack={true}
      bounds="window"
      className={`z-50 ${isPinned ? "!right-6 !bottom-6 !w-96 !h-[600px]" : ""}`}
    >
      <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-xl border border-purple-800 select-text">
        <div className="flex items-center justify-between p-4 border-b border-purple-700 bg-gray-900 rounded-t-lg">
          <div className="flex items-center">
            <MessageSquare size={18} className="text-purple-400 mr-2" />
            <h3 className="font-semibold">AI Security Assistant</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPinned(!isPinned)}
              className="text-purple-400 hover:text-purple-300"
              title={isPinned ? "Unpin" : "Pin"}
            >
              <Pin size={16} />
            </button>
            <button
              onClick={() => setChatVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${msg.role === "user" 
                ? "bg-purple-900/30 ml-auto" 
                : "bg-gray-700/50"} transition-all hover:bg-opacity-70`}
            >
              <div className="text-sm">
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="p-3 rounded-lg bg-gray-700/50 w-4/5">
              <div className="animate-pulse">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputMessage.trim()) {
              addMessage(inputMessage.trim());
              setInputMessage("");
            }
          }}
          className="p-4 border-t border-purple-700"
        >
          <div className="relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about security..."
              className="w-full bg-gray-700 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="absolute right-2 top-2 text-purple-400 hover:text-purple-300"
              disabled={isLoading}
            >
              ↵
            </button>
          </div>
        </form>
      </div>
    </Rnd>
  );
}