// contexts/AIChatContext.js
"use client";
import { createContext, useContext, useState } from "react";
import { useTerminalContext } from "./TerminalContext";
import { CommandProcessorContext } from "./CommandProcessorContext";

const AIChatContext = createContext();

export function AIChatProvider({ children }) {
  const { setTerminalInput} = useTerminalContext();
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const {processCommand} = useContext(CommandProcessorContext)

  const addMessage = async (newMessage) => {
    setMessages(prev => [...prev, { role: "user", content: newMessage }]);
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: newMessage }] }),
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error getting response" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIChatContext.Provider value={{
      chatVisible,
      setChatVisible,
      messages,
      addMessage,
      isLoading,
      isPinned,
      setIsPinned,
      setTerminalInput,
      processCommand
    }}>
      {children}
    </AIChatContext.Provider>
  );
}

export const useAIChat = () => useContext(AIChatContext);