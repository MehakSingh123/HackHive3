import { useState } from "react";

// hooks/useVM.js
export default function useVM(addTerminalOutput, sharedState) {
  const [vmStatus, setVMStatus] = useState("Not Started");


  // Start the VM using POST to /api/vm
  const startVM = async () => {
    setVMStatus("Starting...");
    addTerminalOutput("system", "Starting Virtual Machine...");
    try {
      const res = await fetch("/api/vm", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setVMStatus("Started");
        addTerminalOutput("system", "Virtual machine started successfully.");
        addTerminalOutput("prompt", "root@vm:~#");
      } else {
        setVMStatus("Error Starting VM");
        addTerminalOutput("error", `Error: ${data.error}`);
      }
    } catch (error) {
      setVMStatus("Error Starting VM");
      addTerminalOutput("error", `Connection error: ${error.message}`);
    }
  };

  // Stop the VM using DELETE to /api/vm
  const stopVM = async () => {
    setVMStatus("Stopping...");
    addTerminalOutput("system", "Stopping Virtual Machine...");
    try {
      const res = await fetch("/api/vm", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setVMStatus("Not Started");
        addTerminalOutput("system", "Virtual machine stopped successfully.");
      } else {
        setVMStatus("Error Stopping VM");
        addTerminalOutput("error", `Error: ${data.error}`);
      }
    } catch (error) {
      setVMStatus("Error Stopping VM");
      addTerminalOutput("error", `Connection error: ${error.message}`);
    }
  };

  return { vmStatus, startVM, stopVM};
}