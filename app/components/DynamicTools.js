// components/DynamicToolForm.js
"use client";
import { useState, useContext } from "react";
import { TerminalContext } from "../contexts/TerminalContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { CommandProcessorContext } from "../contexts/CommandProcessorContext";

export default function DynamicToolForm({ toolConfig, onClose }) {
  const { addTerminalOutput } = useContext(TerminalContext);
  const {processCommand} = useContext(CommandProcessorContext)
  const [formValues, setFormValues] = useState(toolConfig.initialValues || {});
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState(null);

  const handleChange = (e, input) => {
    const value = input.type === "checkbox" ? e.target.checked : e.target.value;
    setFormValues((prev) => ({ ...prev, [input.name]: value }));
  };

  const renderInput = (input) => {
    // Check for visibility condition
    if (input.visibleWhen && formValues[input.visibleWhen.field] !== input.visibleWhen.value) {
      return null;
    }
    switch (input.type) {
      case "text":
        return (
          <div key={input.name} className="mt-2">
            <label className="block text-lg mb-2 text-blue-300">{input.label}</label>
            <input
              type="text"
              placeholder={input.placeholder}
              value={formValues[input.name] || ""}
              onChange={(e) => handleChange(e, input)}
              className="w-full bg-gray-700 rounded-lg px-4 py-3 text-base"
            />
          </div>
        );
      case "select":
        return (
          <div key={input.name} className="mt-2">
            <label className="block text-lg mb-2 text-blue-300">{input.label}</label>
            <select
              value={formValues[input.name] || ""}
              onChange={(e) => handleChange(e, input)}
              className="w-full bg-gray-700 rounded-lg px-4 py-3 text-base"
            >
              {input.options.map((opt, i) => (
                <option key={i} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );
      case "checkbox":
        return (
          <div key={input.name} className="flex items-center gap-3 mt-2">
            <input
              type="checkbox"
              checked={formValues[input.name] || false}
              onChange={(e) => handleChange(e, input)}
              className="w-5 h-5 accent-blue-500"
            />
            <span className="text-base">{input.label}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    // Build command using the provided function in the configuration.
    const command = toolConfig.buildCommand
      ? toolConfig.buildCommand(formValues)
      : toolConfig.command + " " + Object.values(formValues).join(" ");
    processCommand(command)
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      const rawOutput = data.output;

      let processedOutput = rawOutput;
      // If AI processing is defined, send raw output for analysis.
      if (toolConfig.aiProcessing) {
        const prompt = toolConfig.aiProcessing.prompt.replace("{output}", rawOutput);
        const analysisRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: prompt,
            }],
          }),
        });
        const analysisData = await analysisRes.json();
        processedOutput = analysisData.content || rawOutput;
      }
      // Optionally process the result via a processor function.
      if (toolConfig.processResult) {
        processedOutput = toolConfig.processResult(rawOutput, processedOutput);
      }
      setResults({ raw: rawOutput, processed: processedOutput });
    } catch (error) {
      addTerminalOutput("error", `Execution failed: ${error.message}`);
      setResults(null);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-700">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          {toolConfig.icon} {toolConfig.name}
        </h3>
        <button onClick={onClose} className="text-gray-300 hover:text-white text-2xl p-2">
          ×
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-4">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left Column – Dynamic Form */}
          <div className="space-y-6 p-2">
            {toolConfig.config.inputs.map((input) => renderInput(input))}
          </div>

          {/* Right Column – Results */}
          <div className="bg-gray-700/30 rounded-xl p-4">
            {results ? (
              <div className="h-full flex flex-col">
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => navigator.clipboard.writeText(results.raw)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
                  >
                    📋 Copy Raw
                  </button>
                  <button
                    onClick={() => processCommand(`echo "${results.raw}" > scan_results.txt`)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
                  >
                    💾 Save Results
                  </button>
                </div>
                <div className="prose prose-invert max-w-none flex-1 overflow-y-auto">
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {results.processed}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                {isExecuting ? (
                  <div className="text-center">
                    <div className="animate-pulse text-4xl mb-4">🔍</div>
                    <p className="text-xl">Processing...</p>
                  </div>
                ) : (
                  "Results will appear here"
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="mt-6 pt-4 border-t border-blue-700">
        <button
          onClick={handleExecute}
          disabled={isExecuting || !formValues[toolConfig.config.inputs[0].name]}
          className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-lg ${
            isExecuting ? "bg-blue-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"
          } transition-all`}
        >
          {isExecuting ? (
            <>
              <div className="animate-spin text-2xl">🌀</div> Processing...
            </>
          ) : (
            <>Launch {toolConfig.name} </>
          )}
        </button>
      </div>
    </div>
  );
}
