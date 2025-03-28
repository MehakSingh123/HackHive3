// contexts/TerminalContext.js
import React, { createContext, useContext } from "react";
import useTerminalHook from "../hooks/useTerminal";

export const TerminalContext = createContext();

export function TerminalProvider({ children }) {
  const terminal = useTerminalHook([{
    type: "system",
    content: "Terminal ready. Start VM to begin."
  }]);

  return (
    <TerminalContext.Provider value={terminal}>
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