// contexts/AIChatContext.js
"use client";
import { createContext, useContext, useState, useCallback } from "react";

const AIChatContext = createContext();

export function AIChatProvider({ children }) {
  // Removed Terminal context usage here
  const [messages, setMessages] = useState([
      // Optional: Add an initial system message
      // { role: "assistant", content: "Hello! How can I assist you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  // Removed chatVisible and isPinned states

  const addMessage = useCallback(async (newMessageContent) => {
     // Add user message immediately
     const userMessage = { role: "user", content: newMessageContent };
     setMessages(prev => [...prev, userMessage]);
     setIsLoading(true);

     // Prepare messages to send to API (e.g., include history)
     // const messagesToSend = [...messages, userMessage]; // Or adjust history length as needed

     try {
       const res = await fetch("/api/chat", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         // Send current message history along with the new one
         body: JSON.stringify({ messages: [...messages, userMessage] }), // Send history
       });

       if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(errorData.error || `API request failed with status ${res.status}`);
       }

       const data = await res.json();
       if (data.content) {
           setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
       } else {
            throw new Error("Received empty response from AI");
       }

     } catch (error) {
       console.error("Error fetching AI response:", error);
       setMessages(prev => [...prev, { role: "assistant", content: `Error: ${error.message}` }]);
     } finally {
       setIsLoading(false);
     }
   }, [messages]); // Include messages in dependency array for history


    const clearChat = useCallback(() => {
        setMessages([]); // Reset messages array
        // Optional: Add back an initial system message if desired
        // setMessages([{ role: "assistant", content: "Chat cleared. How can I help?" }]);
    }, []);

  return (
    <AIChatContext.Provider value={{
      messages,
      addMessage,
      isLoading,
      clearChat // Expose clear chat function
      // Removed chatVisible, setChatVisible, isPinned, setIsPinned, setTerminalInput, processCommand
    }}>
      {children}
    </AIChatContext.Provider>
  );
}

export const useAIChat = () => {
    const context = useContext(AIChatContext);
    if (context === undefined) {
        throw new Error('useAIChat must be used within an AIChatProvider');
    }
    return context;
};