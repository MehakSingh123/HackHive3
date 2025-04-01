// components/DynamicToolForm.js
"use client";
import { useState, useContext, useEffect } from "react";
import { TerminalContext } from "../contexts/TerminalContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { CommandProcessorContext } from "../contexts/CommandProcessorContext";
import DOMPurify from 'dompurify'; // Import DOMPurify
import { Bot, Loader2, Save, Copy } from "lucide-react"; // Added more icons

export default function DynamicToolForm({ toolConfig, onClose }) {
  const { addTerminalOutput } = useContext(TerminalContext);
  const { processCommand } = useContext(CommandProcessorContext);
  const [formValues, setFormValues] = useState(toolConfig.initialValues || {});
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState(null); // Will store { raw, processedMarkdown, styledHtml }
  const [isStylingResult, setIsStylingResult] = useState(false); // Loading state for AI styling

  // State for AI-generated description
  const [aiDescription, setAiDescription] = useState("");
  const [isDescriptionLoading, setIsDescriptionLoading] = useState(false);

  // Fetch AI description when the component mounts or toolConfig changes
  useEffect(() => {
    if (!toolConfig || !toolConfig.name) return;

    const fetchDescription = async () => {
      setIsDescriptionLoading(true);
      setAiDescription(""); // Clear previous description
      try {
        const prompt = `Generate a short, fun, and insightful description (1-2 sentences) for the cybersecurity tool named "${toolConfig.name}". Describe its primary purpose in an engaging way.`;
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!res.ok) throw new Error('Failed to fetch AI description');
        const data = await res.json();
        setAiDescription(data.content || "Could not generate AI description.");
      } catch (error) {
        console.error("Error fetching AI description:", error);
        setAiDescription("Error loading description.");
      } finally {
        setIsDescriptionLoading(false);
      }
    };

    fetchDescription();
  }, [toolConfig]); // Re-run if toolConfig changes


  const handleChange = (e, input) => {
    const value = input.type === "checkbox" ? e.target.checked : e.target.value;
    setFormValues((prev) => ({ ...prev, [input.name]: value }));
  };

  const renderInput = (input) => {
    // Conditional visibility logic remains the same...
    if (input.visibleWhen && formValues[input.visibleWhen.field] !== input.visibleWhen.value) {
      return null;
    }
    // Input rendering logic with improved visibility
    switch (input.type) {
      case "text":
        return (
          <div key={input.name} className="mt-4">
            <label className="block text-lg mb-2 text-white font-medium">{input.label}</label>
            <input
              type="text"
              placeholder={input.placeholder}
              value={formValues[input.name] || ""}
              onChange={(e) => handleChange(e, input)}
              className="w-full bg-gray-700 rounded-lg px-4 py-3 text-base border border-gray-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none text-white" // Added text-white
            />
          </div>
        );
      case "select":
        return (
           <div key={input.name} className="mt-4">
            <label className="block text-lg mb-2 text-white font-medium">{input.label}</label>
            <select
              value={formValues[input.name] || ""}
              onChange={(e) => handleChange(e, input)}
              className="w-full bg-gray-700 rounded-lg px-4 py-3 text-base border border-gray-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none appearance-none text-white" // Added text-white
            >
               {/* Default empty/placeholder option */}
               {!formValues[input.name] && <option value="" disabled>{input.placeholder || 'Select an option'}</option>}
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
          <div key={input.name} className="flex items-center gap-3 mt-4">
            <input
              type="checkbox"
              id={`checkbox-${input.name}`}
              checked={formValues[input.name] || false}
              onChange={(e) => handleChange(e, input)}
              className="w-5 h-5 accent-blue-500 cursor-pointer"
            />
            {/* Link label to checkbox */}
            <label htmlFor={`checkbox-${input.name}`} className="text-base cursor-pointer select-none text-white">{input.label}</label>
          </div>
        );
      default:
        return null;
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setIsStylingResult(false);
    setResults(null);

    const command = toolConfig.buildCommand
      ? toolConfig.buildCommand(formValues)
      : toolConfig.command + " " + Object.entries(formValues)
          .filter(([key, value]) => value !== false && value !== '')
          .map(([key, value]) => value === true ? ` --${key}` : ` ${value}`)
          .join("");

    // Add the command itself to the terminal
    addTerminalOutput("command", `$ ${command}`);

    try {
      const executeRes = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });

      let data; // Define data here

      // --- Start of robust fetching logic ---
      if (!executeRes.ok) {
        let errorMsg = `Execution failed with status ${executeRes.status} (${executeRes.statusText})`;
        try {
            const errorData = await executeRes.json();
            errorMsg = errorData.error || errorMsg;
            // **** ADD ERROR TO TERMINAL TOO ****
            addTerminalOutput('error', `Error: ${errorMsg}`);
            // Add any additional output from the error response if available
            if (errorData.output) {
                addTerminalOutput('output', errorData.output);
            }
        } catch (e) {
             try {
                const errorText = await executeRes.text();
                if (errorText) errorMsg = errorText.substring(0, 200);
                // **** ADD TEXT ERROR TO TERMINAL TOO ****
                 addTerminalOutput('error', `Error: ${errorMsg}`);
            } catch (textErr) { /* Ignore */ }
        }
        throw new Error(errorMsg);
      }

      const contentType = executeRes.headers.get("content-type");
       if (!contentType || !contentType.includes("application/json")) {
           const textOutput = await executeRes.text();
           console.warn("Received non-JSON response from /api/execute, treating as raw text.");
           data = { output: textOutput };
       } else {
            data = await executeRes.json();
       }
       // --- End of robust fetching logic ---


      const rawOutput = data.output || "No output received.";

      // Add the raw output to the terminal
      addTerminalOutput('output', rawOutput);

      let processedMarkdown = rawOutput;
      let styledHtml = '';

      // --- Optional AI Processing (from config) ---
      if (toolConfig.aiProcessing) {
        try {
          const analysisPrompt = `Analyze the following ${toolConfig.name} output and provide concise insights:
          \`\`\`
          ${rawOutput}
          \`\`\`
          ${toolConfig.aiProcessingPrompt || ''}`;
          
          const analysisRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: analysisPrompt }],
            }),
          });
          
          if (!analysisRes.ok) {
            const errorData = await analysisRes.json().catch(() => ({}));
            throw new Error(errorData.error || `AI analysis failed with status ${analysisRes.status}`);
          }
          
          try {
            const analysisData = await analysisRes.json();
            processedMarkdown = analysisData.content || rawOutput;
          } catch (jsonError) {
            console.error("Error parsing AI analysis response:", jsonError);
            throw new Error("AI analysis returned invalid data.");
          }
        } catch (analysisError) {
          console.error("Error in AI analysis:", analysisError);
          addTerminalOutput('error', `AI analysis error: ${analysisError.message}`);
          // Continue with raw output if AI analysis fails
          processedMarkdown = rawOutput;
        }
      }

      // --- Optional Result Processor (from config) ---
      if (toolConfig.processResult) {
        processedMarkdown = toolConfig.processResult(rawOutput, processedMarkdown);
      }

      // --- AI Styling Step ---
      setIsStylingResult(true);
      try {
        const stylingPrompt = `Format the following output as styled HTML to make it readable, organized and visually appealing:
        \`\`\`
        ${processedMarkdown}
        \`\`\`
        Use HTML elements (like tables for tabular data, code blocks with syntax highlighting when appropriate), and add CSS classes for styling.
        If there are important findings or alerts, highlight them with appropriate colors. 
        Focus on readability and information hierarchy. Include a brief summary at the top if helpful.`;
        
        const styleRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: stylingPrompt }],
          }),
        });
        
        if (!styleRes.ok) {
          const errorData = await styleRes.json().catch(() => ({}));
          throw new Error(errorData.error || `AI styling failed with status ${styleRes.status}`);
        }
        
        try {
          const styleData = await styleRes.json();
          styledHtml = styleData.content || `<pre>${processedMarkdown}</pre>`;
        } catch (jsonError) {
          console.error("Error parsing AI styling response:", jsonError);
          styledHtml = `<pre class="text-red-400">Error styling results.</pre><hr/><pre>${processedMarkdown}</pre>`;
        }
      } catch(styleError) {
        console.error("Error styling results with AI:", styleError);
        styledHtml = `<pre class="text-red-400">Error styling results.</pre><hr/><pre>${processedMarkdown}</pre>`;
        // Optionally add styling error to terminal
        addTerminalOutput('error', `Error during AI styling: ${styleError.message}`);
      } finally {
        setIsStylingResult(false);
      }

      // Update local results state for the UI panel
      setResults({ raw: rawOutput, processedMarkdown, styledHtml });

    } catch (error) {
      console.error("Error in handleExecute:", error);
      // The error should have already been added to the terminal output inside the try block's error handling.
      // We still update the local UI panel's state.
      setResults({
        raw: `Error: ${error.message}`,
        processedMarkdown: `Error: ${error.message}`,
        styledHtml: `<p class="text-red-400 font-semibold">Execution Failed:</p><pre class="text-red-400">${error.message}</pre>`
      });
    } finally {
      setIsExecuting(false);
      // Add the prompt again after execution finishes (success or failure)
      addTerminalOutput("prompt", "root@vm:~# ");
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white rounded-xl">
      {/* Header - Updated with gradient background */}
      <div className="flex justify-between items-start mb-4 pb-4 border-b border-[#00ADEE]/70 px-6 pt-6 bg-gradient-to-r from-gray-900 to-gray-800">
        <div>
          <h3 className="text-3xl font-bold flex items-center gap-3 text-[#00ADEE]">
            {toolConfig.icon || <Bot size={28}/>} {toolConfig.name}
          </h3>
          {/* AI Generated Description */}
          <div className="text-sm text-blue-100 mt-2 flex items-center gap-2 min-h-[20px]">
            {isDescriptionLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Loading description...
              </>
            ) : (
              <>
               <Bot size={16} className="text-blue-400 flex-shrink-0"/> <span>{aiDescription}</span>
              </>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-white hover:bg-gray-700 text-3xl p-1 -mt-1 rounded-full h-8 w-8 flex items-center justify-center">
          ×
        </button>
      </div>

      {/* Content Area (scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {/* Left Column – Dynamic Form */}
          <div className="space-y-4 pr-4 border-r border-gray-700/70">
             <h4 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2 px-4 rounded-lg inline-block">Configuration</h4>
            {toolConfig.config.inputs.map((input) => renderInput(input))}
          </div>

          {/* Right Column – Results with improved visibility */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col h-[calc(85vh-260px)]">
             <h4 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2 px-4 rounded-lg inline-block">Results</h4>
            {isExecuting ? (
               <div className="flex-1 flex items-center justify-center text-gray-300">
                 <div className="text-center">
                   <Loader2 size={40} className="animate-spin text-[#00ADEE] mb-4 mx-auto" />
                   <p className="text-xl">Executing Command...</p>
                 </div>
               </div>
            ) : isStylingResult ? (
                 <div className="flex-1 flex items-center justify-center text-gray-300">
                 <div className="text-center">
                   <Loader2 size={40} className="animate-spin text-blue-400 mb-4 mx-auto" />
                   <p className="text-xl">AI Formatting Results...</p>
                 </div>
               </div>
            ) : results ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex gap-3 mb-3 flex-shrink-0">
                  <button
                    onClick={() => navigator.clipboard.writeText(results.raw)}
                    title="Copy raw output to clipboard"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm flex items-center gap-1.5 text-white"
                  >
                    <Copy size={16} /> <span className="hidden sm:inline">Copy Raw</span>
                  </button>
                  <button
                    onClick={() => processCommand(`echo "${results.raw.replace(/"/g, '\\"')}" > ${toolConfig.name}_results.txt`)}
                    title="Save raw output to a file in the VM"
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm flex items-center gap-1.5 text-white"
                  >
                    <Save size={16} /> <span className="hidden sm:inline">Save Raw</span>
                  </button>
                </div>
                {/* Styled HTML Output Area with improved styling */}
                <div className="prose prose-sm prose-invert max-w-none flex-1 overflow-y-auto bg-gray-800 p-4 rounded-lg shadow-inner scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900/0 border border-gray-700 text-white">
                   {/* Use dangerouslySetInnerHTML with DOMPurify */}
                   <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(results.styledHtml) }} />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 bg-gray-800/40 rounded-lg border border-gray-700/50 p-4">
                <div className="text-center">
                  <Bot size={40} className="text-gray-500 mb-4 mx-auto" />
                  <p>Run the tool to see results here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls with gradient button */}
      <div className="px-6 pb-6 pt-4 border-t border-[#00ADEE]/70 mt-auto flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-800">
        <button
          onClick={handleExecute}
          disabled={isExecuting || isStylingResult || !formValues[toolConfig.config.inputs[0]?.name]}
          className={`w-full py-3 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold ${
            (isExecuting || isStylingResult)
              ? "bg-blue-800/60 text-blue-300 cursor-not-allowed"
              : !formValues[toolConfig.config.inputs[0]?.name]
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#00ADEE] to-[#0090C5] hover:from-[#0090C5] hover:to-[#00ADEE] text-white"
          } transition-all duration-200 ease-in-out shadow-lg`}
        >
          {(isExecuting || isStylingResult) ? (
            <>
              <Loader2 className="animate-spin" size={24} /> Processing...
            </>
          ) : (
            <>Launch {toolConfig.name} </>
          )}
        </button>
      </div>
    </div>
  );
}