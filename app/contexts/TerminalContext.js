// contexts/TerminalContext.js
import React, { createContext } from "react";
import useTerminal from "../hooks/useTerminal";

export const TerminalContext = createContext();

export function TerminalProvider({ children }) {
  const terminal = useTerminal([{ type: "system", content: "Terminal ready. Start VM to begin." }]);
  return (
    <TerminalContext.Provider value={terminal}>
      {children}
    </TerminalContext.Provider>
  );
}
