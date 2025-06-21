// app/ai/page.js
"use client";
import { Zap, Sparkles, Terminal, Shield } from "lucide-react";
import { useState } from "react";
import { useAIChat } from "../contexts/AIChatContext";
import { useWindowManager } from "../contexts/WindowManagerContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy } from "lucide-react";

export default function AiPage() {
  const { messages, addMessage, isLoading } = useAIChat();
  const { openWindow, WINDOW_TYPES, sendCommandToTerminal } =
    useWindowManager();

  const [input, setInput] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Now you just pass the user's direct input.
    // The context and system prompt are handled automatically.
    await addMessage(input);

    setInput("");
  };
  const renderFormattedContent = (content) => {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const langAndCode = part.split("\n");
        const language = langAndCode[0].trim().toLowerCase() || "bash";
        const code = langAndCode.slice(1).join("\n").trim();

        const handleCopy = () => navigator.clipboard.writeText(code);
        const handleExecute = () => {
          if (!code) return;
          console.log(`Requesting terminal run for command: ${code}`);

          // Step 1: Open the terminal window
          openWindow({ type: WINDOW_TYPES.TERMINAL, title: "Terminal" });

          // Step 2: Delay and send command
          setTimeout(() => {
            try {
              sendCommandToTerminal(code + "\n");
              console.log("Command sent to terminal.");
            } catch (err) {
              console.error("Error sending command to terminal:", err);
            }
          }, 300); // Adjust delay if needed
        };

        return (
          <div key={index} className="relative group my-2">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              className="rounded-md p-3 text-sm border border-gray-700"
              customStyle={{
                margin: 0,
                background: "#1e1e1e",
                maxHeight: "300px",
                overflow: "auto",
              }}
              wrapLongLines
              PreTag="div"
            >
              {code}
            </SyntaxHighlighter>

            <div className="absolute top-1.5 right-1.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 bg-[#0A2540]/80 rounded hover:bg-[#081A2C]/90 border border-[#00ADEE]/30"
                title="Copy"
              >
                <Copy size={12} className="text-[#00ADEE]" />
              </button>
              <button
                onClick={handleExecute}
                className="p-1 bg-[#0A2540]/80 rounded hover:bg-[#081A2C]/90 border border-[#00ADEE]/30"
                title="Execute"
              >
                <Terminal size={12} className="text-[#00ADEE]" />
              </button>
            </div>
          </div>
        );
      }

      // Render regular text, with basic URL highlighting
      const linkRegex = /(https?:\/\/[^\s]+)/g;
      const textParts = part.split(linkRegex);
      return (
        <p key={index} className="whitespace-pre-wrap break-words text-white">
          {textParts.map((txt, i) =>
            linkRegex.test(txt) ? (
              <a
                key={i}
                href={txt}
                className="text-blue-400 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {txt}
              </a>
            ) : (
              txt
            )
          )}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-lg bg-blue-500/20">
          <Zap size={24} className="text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          HiveMind Security AI
        </h1>
      </div>

      <div className="bg-gray-800/50 rounded-xl border border-blue-500/30 backdrop-blur-sm p-6">
        <div className="h-96 overflow-y-auto mb-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg ${
                msg.role === "user"
                  ? "bg-gray-700/30 ml-auto w-3/4"
                  : "bg-blue-500/10 w-full"
              }`}
            >
              <div className="flex gap-2 mb-2">
                {msg.role === "assistant" && (
                  <Sparkles size={16} className="text-blue-400" />
                )}
                <span className="font-mono text-sm text-blue-300">
                  {msg.role === "user" ? "You:" : "HiveMind:"}
                </span>
              </div>
              <div className="text-sm space-y-2">
                {renderFormattedContent(msg.content)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-400">
              <div className="animate-spin">🌀</div>
              Analyzing security context...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for vulnerability analysis, tool usage, or security recommendations..."
            className="flex-1 bg-gray-900/50 p-3 rounded-lg border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Terminal size={18} />
            Analyze
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-800/30 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-green-400" />
            <h3 className="font-medium">Quick Actions</h3>
          </div>
          <p className="text-sm text-gray-400">
            Try: "Show nmap command for full port scan"
          </p>
        </div>
        <div className="p-4 bg-gray-800/30 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-purple-400" />
            <h3 className="font-medium">AI Capabilities</h3>
          </div>
          <p className="text-sm text-gray-400">
            Log analysis, CVE lookup, tool configuration
          </p>
        </div>
        <div className="p-4 bg-gray-800/30 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-yellow-400" />
            <h3 className="font-medium">Response Format</h3>
          </div>
          <p className="text-sm text-gray-400">
            Commands in <code className="text-blue-300">code blocks</code>,
            priorities in bold
          </p>
        </div>
      </div>
    </div>
  );
}
