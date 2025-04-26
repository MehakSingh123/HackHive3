// contexts/TerminalContext.js
"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";

export const TerminalContext = createContext(undefined); // Initialize with undefined

export function TerminalProvider({ children }) {
  const [terminalOutput, setTerminalOutput] = useState([{
    type: "system",
    content: "Terminal Initialized." // Changed initial message
  }, {
    type: "prompt", // Add initial prompt
    content: "root@vm:~# "
  }]);
  const [terminalInput, setTerminalInput] = useState("");
  // Removed terminalVisible state
  const terminalRef = useRef(null); // Keep ref for potential use in TerminalContent

  const addTerminalOutput = useCallback((type, content) => {
     // Ensure content is a string, handle potential errors or non-string types gracefully
     const contentString = String(content ?? ''); // Default to empty string if null/undefined
     if (!contentString) return;

     // Handle multiline output more carefully
     const lines = contentString.split('\n');

     setTerminalOutput(prev => {
       const newOutput = [...prev];

       // Remove the last prompt line if it exists, to append output before it
       if (newOutput.length > 0 && newOutput[newOutput.length - 1].type === 'prompt') {
           newOutput.pop();
       }

       lines.forEach((line, index) => {
            // Add each line as a separate entry of the specified type
            // Avoid adding empty lines unless it's the only line
            if (line || lines.length === 1) {
                 newOutput.push({ type, content: line });
            }
       });

       // Add the prompt back at the end if the last added type wasn't a prompt itself
        if (type !== 'prompt') {
            newOutput.push({ type: 'prompt', content: 'root@vm:~# ' });
        }

       // Keep last N lines (adjust N as needed)
       const maxLines = 1500;
       return newOutput.slice(-maxLines);
     });
   }, []);

  const clearTerminal = useCallback(() => {
    setTerminalOutput([{
      type: "system",
      content: "Terminal cleared."
    }, {
      type: "prompt", // Add prompt after clearing
      content: "root@vm:~# "
    }]);
    setTerminalInput(""); // Clear input field as well
  }, []);

  return (
    <TerminalContext.Provider value={{
      terminalOutput,
      terminalInput,
      setTerminalInput,
      terminalRef, // Keep exposing ref if TerminalContent needs it
      addTerminalOutput,
      clearTerminal
      // Removed terminalVisible, setTerminalVisible
    }}>
      {children}
    </TerminalContext.Provider>
  );
}

export const useTerminalContext = () => {
  const context = useContext(TerminalContext);
  if (context === undefined) { // Check for undefined initialization
    throw new Error("useTerminalContext must be used within a TerminalProvider");
  }
  return context;
};