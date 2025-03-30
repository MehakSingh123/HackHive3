// components/Terminal.js
"use client";
import { Terminal as TerminalIcon, X, Minimize, Maximize } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { useTerminalContext } from "../contexts/TerminalContext";
import { CommandProcessorContext } from "../contexts/CommandProcessorContext";

export default function Terminal() {
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
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (terminalVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [terminalVisible]);

  if (!terminalVisible)
    return (
      <button
        onClick={() => setTerminalVisible(!terminalVisible)}
        className="fixed bottom-6 right-6 bg-[#00ADEE] hover:bg-[#0090C5] text-white p-3 rounded-md shadow-lg z-30 transition-all active:scale-95 flex items-center gap-2"
        title="Open Terminal"
      >
        <TerminalIcon size={20} />
        <span className="font-medium">Terminal</span>
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
    <div className={`fixed inset-x-0 ${minimized ? 'h-12' : 'h-80'} bottom-0 bg-[#0A0F14] border-t border-[#00ADEE]/50 z-20 shadow-2xl flex flex-col transition-all duration-200`}>
      <div className="bg-[#081A2C] px-4 py-2 border-b border-[#00ADEE]/30 flex justify-between items-center">
        <div className="flex items-center">
          <TerminalIcon size={16} className="text-[#00ADEE] mr-2" />
          <h3 className="font-mono text-[#00ADEE] font-medium">root@kali:~#</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMinimized(!minimized)}
            className="text-gray-400 hover:text-white bg-[#0A2540] p-1 rounded"
          >
            {minimized ? <Maximize size={14} /> : <Minimize size={14} />}
          </button>
          <button
            onClick={() => setTerminalVisible(false)}
            className="text-gray-400 hover:text-white bg-[#0A2540] p-1 rounded"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      {!minimized && (
        <>
          <div
            ref={terminalRef}
            className="flex-1 font-mono text-sm p-3 overflow-y-auto bg-[#0A0F14] scrollbar-thin scrollbar-thumb-[#00ADEE]/20 scrollbar-track-transparent"
          >
            {terminalOutput.map((line, index) => (
              <div key={index} className="mb-1">
                {line.type === "system" && (
                  <span className="text-[#FFCD00]">[SYSTEM] {line.content}</span>
                )}
                {line.type === "error" && (
                  <span className="text-[#FF3860]">{line.content}</span>
                )}
                {line.type === "command" && (
                  <span className="text-white">{line.content}</span>
                )}
                {line.type === "output" && (
                  <span className="text-gray-300">{line.content}</span>
                )}
                {line.type === "prompt" && (
                  <span className="text-[#00ADEE]">{line.content}</span>
                )}
              </div>
            ))}
          </div>
          <form
            onSubmit={handleTerminalSubmit}
            className="px-3 py-2 border-t border-[#00ADEE]/10 bg-[#0A0F14] flex"
          >
            <span className="text-[#00ADEE] font-mono mr-2">root@kali:~#</span>
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
        </>
      )}
    </div>
  );
}