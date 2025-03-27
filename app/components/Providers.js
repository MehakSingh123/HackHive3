// components/Providers.js
"use client";
import { TerminalProvider } from "../contexts/TerminalContext";
import { VMProvider } from "../contexts/VMContext";
import { CommandProcessorProvider } from "../contexts/CommandProcessorContext";
import { AIChatProvider } from "../contexts/AIChatContext";

export default function Providers({ children }) {
  return (
    <TerminalProvider>
      <VMProvider>
        <CommandProcessorProvider>
          <AIChatProvider>
            {children}
          </AIChatProvider>
        </CommandProcessorProvider>
      </VMProvider>
    </TerminalProvider>
  );
}