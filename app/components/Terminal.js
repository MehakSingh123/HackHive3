// components/Terminal.js
"use client";
import { Terminal as TerminalIcon } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import { useTerminalContext } from "../contexts/TerminalContext";
import { CommandProcessorContext } from "../contexts/CommandProcessorContext";

export default function Terminal() {
  // Properly destructure from context
  const {
    terminalOutput,
    terminalInput,
    setTerminalInput,
    terminalVisible,
    setTerminalVisible,
    terminalRef,
    clearTerminal
  } = useTerminalContext();

  const { processCommand } = useContext(CommandProcessorContext);
  const inputRef = useRef(null);

  useEffect(() => {
    if (terminalVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [terminalVisible]);

  if (!terminalVisible)
    return (
      <button
        onClick={() => setTerminalVisible(!terminalVisible)}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-500 text-white p-3 rounded-full shadow-lg z-30 transition-all active:scale-95"
        title="Toggle Terminal"
      >
        <TerminalIcon size={24} />
      </button>
    );

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    if (terminalInput.trim() === "clear") {
      clearTerminal();
    } else {
      processCommand(terminalInput.trim());
    }
    setTerminalInput("");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-black/90 border-t border-green-800 h-72 z-20 shadow-2xl flex flex-col">
      <div className="bg-gray-900 px-4 py-2 border-b border-green-800 flex justify-between items-center">
        <div className="flex items-center">
          <TerminalIcon size={16} className="text-green-500 mr-2" />
          <h3 className="font-mono text-green-500">VM Terminal</h3>
        </div>
        <button
          onClick={() => setTerminalVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 font-mono text-sm p-2 overflow-y-auto bg-black"
      >
        {terminalOutput.map((line, index) => (
          <div key={index} className="mb-1">
            {line.type === "system" && (
              <span className="text-yellow-500">[SYSTEM] {line.content}</span>
            )}
            {line.type === "error" && (
              <span className="text-red-500">{line.content}</span>
            )}
            {line.type === "command" && (
              <span className="text-white">{line.content}</span>
            )}
            {line.type === "output" && (
              <span className="text-gray-300">{line.content}</span>
            )}
            {line.type === "prompt" && (
              <span className="text-green-500">{line.content}</span>
            )}
          </div>
        ))}
      </div>
      <form
        onSubmit={handleTerminalSubmit}
        className="px-2 py-2 border-t border-gray-800 bg-black flex"
      >
        <span className="text-green-500 font-mono mr-2">root@vm:~#</span>
        <input
          ref={inputRef}
          type="text"
          value={terminalInput}
          onChange={(e) => setTerminalInput(e.target.value)}
          placeholder="Enter command..."
          className="flex-1 bg-transparent border-none outline-none font-mono text-white"
          autoComplete="off"
        />
      </form>
    </div>
  );
}
