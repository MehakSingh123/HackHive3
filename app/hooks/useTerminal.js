// hooks/useTerminal.js
import { useState, useEffect, useRef } from "react";

export default function useTerminal(
  initialOutput = [
    { type: "system", content: "Terminal ready. Start VM to begin." },
  ]
) {
  const [terminalOutput, setTerminalOutput] = useState(initialOutput);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalVisible, setTerminalVisible] = useState(false);
  const terminalRef = useRef(null);

  // Append a new line to terminal output
  const addTerminalOutput = (type, content) => {
    setTerminalOutput((prev) => [...prev, { type, content }]);
  };

  // Clear the terminal content
  const clearTerminal = () => {
    setTerminalOutput(["prompt", "root@vm:~#"]);
  };

  // Auto-scroll terminal to the bottom on new output
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  return {
    terminalOutput,
    terminalInput,
    setTerminalInput,
    terminalVisible,
    setTerminalVisible,
    addTerminalOutput,
    clearTerminal,
    terminalRef,
  };
}
