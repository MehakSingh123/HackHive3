// contexts/AIChatContext.js
"use client";
import { createContext, useContext, useState, useCallback } from "react";

const AIChatContext = createContext();

// CHANGED: The provider now accepts a `systemPrompt` prop.
export function AIChatProvider({ children, systemPrompt }) {
 const [messages, setMessages] = useState([]);
 const [isLoading, setIsLoading] = useState(false);

 const addMessage = useCallback(async (newMessageContent) => {
  const userMessage = { role: "user", content: newMessageContent };
  setMessages(prev => [...prev, userMessage]);
  setIsLoading(true);

  try {
      // CHANGED: We now create the full message payload for the API,
      // including the system prompt, the message history, and the new user message.
   const messagesToSend = [
        { role: "system", content: systemPrompt }, // Always add the system prompt first
        ...messages,
        userMessage
      ];

   const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
        // CHANGED: Send the newly constructed message array.
    body: JSON.stringify({ messages: messagesToSend }),
   });

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `API request failed with status ${res.status}`);
   }

   const data = await res.json();
   if (data.content) {
        // Here, we only add the assistant's response to our local state.
        // The user message is already there. We don't store the system prompt in the visible chat.
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
    // CHANGED: Add `systemPrompt` to the dependency array.
 }, [messages, systemPrompt]);


 const clearChat = useCallback(() => {
  setMessages([]);
 }, []);

 return (
  <AIChatContext.Provider value={{
   messages,
   addMessage,
   isLoading,
   clearChat
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