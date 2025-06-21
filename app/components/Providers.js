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
  const hivemindSystemPrompt = `You are HiveMind — the cybersecurity AI for HackHive.

Your job is to provide:
- Terminal commands in markdown code blocks with language identifiers (e.g., bash)
- A brief technical explanation below each code block

Rules:
1. Always start responses with phrases like: "Here’s the command:", "Recommendation:", or "Try this:"
2. All terminal commands must be wrapped in markdown fenced code blocks using bash  as the language.
3. Keep explanations concise, below the command.
4. Do not explain markdown formatting to the user.
5. Never use tools unless asked (e.g., nmap, sqlmap).

`;
  return (
    <WindowManagerProvider>
      <TerminalProvider>
        <VMProvider>
          <CommandProcessorProvider>
            <AIChatProvider systemPrompt={hivemindSystemPrompt}>
              <NmapProvider>{children}</NmapProvider>
            </AIChatProvider>
          </CommandProcessorProvider>
        </VMProvider>
      </TerminalProvider>
    </WindowManagerProvider>
  );
}
