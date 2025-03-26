// components/Providers.js
"use client";

import { TerminalProvider } from "../contexts/TerminalContext";
import { VMProvider } from "../contexts/VMContext";
import { CommandProcessorProvider } from "../contexts/CommandProcessorContext";

export default function Providers({ children }) {
  return (
    <TerminalProvider>
      <VMProvider>
        <CommandProcessorProvider>{children}</CommandProcessorProvider>
      </VMProvider>
    </TerminalProvider>
  );
}
