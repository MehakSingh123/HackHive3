// components/Providers.js
"use client";
import { TerminalProvider } from "../contexts/TerminalContext";
import { VMProvider } from "../contexts/VMContext";
import { CommandProcessorProvider } from "../contexts/CommandProcessorContext";
import { AIChatProvider } from "../contexts/AIChatContext";
import { NmapProvider } from "../contexts/NmapContext";
import { WindowManagerProvider } from "../contexts/WindowManagerContext";
// import { PhishingProvider } from "../contexts/PhishingContext";

export default function Providers({ children }) {
  return (
    <WindowManagerProvider>
      <TerminalProvider>
        <VMProvider>
          <CommandProcessorProvider>
            <AIChatProvider>
              <NmapProvider>{children}</NmapProvider>
            </AIChatProvider>
          </CommandProcessorProvider>
        </VMProvider>
      </TerminalProvider>
    </WindowManagerProvider>
  );
}
