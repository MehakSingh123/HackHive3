// contexts/VMContext.js
import React, { createContext, useContext } from "react";
import useVM from "../hooks/useVM";
import { TerminalContext } from "./TerminalContext";

export const VMContext = createContext();

export function VMProvider({ children }) {
  const { addTerminalOutput } = useContext(TerminalContext);
  const vm = useVM(addTerminalOutput);
  return <VMContext.Provider value={vm}>{children}</VMContext.Provider>;
}
