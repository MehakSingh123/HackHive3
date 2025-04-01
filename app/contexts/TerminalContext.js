"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";

export const TerminalContext = createContext();

export function TerminalProvider({ children }) {
  const [terminalOutput, setTerminalOutput] = useState([{
    type: "system",
    content: "Initializing Terminal..."
  }]);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalVisible, setTerminalVisible] = useState(false);
  const terminalRef = useRef(null);

  const addTerminalOutput = useCallback((type, content) => {
    if (!content) return;
    
    // Handle multiline output
    const lines = content.toString().split('\n');
    
    setTerminalOutput(prev => {
      const newOutput = [...prev];
      
      for (const line of lines) {
        if (line.trim()) {
          newOutput.push({ type, content: line });
        }
      }
      
      // Keep last 1000 lines to prevent excessive memory usage
      return newOutput.slice(-1000);
    });
  }, []);

  const clearTerminal = useCallback(() => {
    setTerminalOutput([{
      type: "system",
      content: "Terminal cleared"
    }]);
  }, []);

  return (
    <TerminalContext.Provider value={{
      terminalOutput,
      terminalInput,
      setTerminalInput,
      terminalVisible,
      setTerminalVisible,
      terminalRef,
      addTerminalOutput,
      clearTerminal
    }}>
      {children}
    </TerminalContext.Provider>
  );
}

export const useTerminalContext = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error("useTerminalContext must be used within a TerminalProvider");
  }
  return context;
};