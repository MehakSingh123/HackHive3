// components/DynamicToolForm.js
"use client";
import React, { useState, useEffect } from "react"; // <-- Import React here

// Removed TerminalContext and CommandProcessorContext imports
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import DOMPurify from 'dompurify';
import { Bot, Loader2, Save, Copy, X as CloseIcon } from "lucide-react"; // Added CloseIcon

// Make sure DOMPurify is configured (can be done once globally or here)
// Example basic configuration (consider more specific configs if needed)
if (typeof window !== 'undefined') { // Ensure this runs only on the client
    DOMPurify.setConfig({
      USE_PROFILES: { html: true },
      // Add other configurations like ALLOWED_TAGS, ALLOWED_ATTR if necessary
    });
}


export default function DynamicToolForm({ toolConfig, onClose, windowId }) { // Added windowId back just in case
  // Removed context hooks for Terminal and CommandProcessor
  const [formValues, setFormValues] = useState(() => {
      // Initialize form state based on toolConfig structure
      const initialState = {};
       // Check if config and inputs exist before iterating
       toolConfig?.config?.inputs?.forEach(input => {
          // Use defaultValue from input config if available, else fallback to empty string
          initialState[input.name] = input.defaultValue !== undefined ? input.defaultValue : '';
      });
      return initialState;
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState(null); // Will store { raw, processedMarkdown, styledHtml }
  const [isStylingResult, setIsStylingResult] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [isDescriptionLoading, setIsDescriptionLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState(''); // For feedback on copy


  useEffect(() => {
    // Fetch AI Description Logic (remains the same)
    if (!toolConfig || !toolConfig.name) return;

    const fetchDescription = async () => {
      setIsDescriptionLoading(true);
      setAiDescription("");
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
  }, [toolConfig]);

  const handleChange = (e, input) => {
    // Ensure input object and type are valid before accessing properties
    if (!input || !input.type) return;
    const value = input.type === "checkbox" ? e.target.checked : e.target.value;
     // Ensure input.name is valid before using it as a key
     if (input.name) {
         setFormValues((prev) => ({ ...prev, [input.name]: value }));
     }
  };

  const renderInput = (input) => {
     // Basic validation for input object
     if (!input || !input.name) return null;

    // Conditional visibility logic
    if (input.visibleWhen) {
         const controllingFieldValue = formValues[input.visibleWhen.field];
         // Check if the controlling field's value necessitates hiding this input
         if (
             (input.visibleWhen.value !== undefined && controllingFieldValue !== input.visibleWhen.value) ||
             (input.visibleWhen.isChecked !== undefined && !!controllingFieldValue !== input.visibleWhen.isChecked) ||
             (input.visibleWhen.isSet !== undefined && input.visibleWhen.isSet && !controllingFieldValue) || // Hide if isSet is true and value is falsy
             (input.visibleWhen.isNotSet !== undefined && input.visibleWhen.isNotSet && !!controllingFieldValue) // Hide if isNotSet is true and value is truthy
         ) {
             return null;
         }
     }

    // Input rendering logic (styles adjusted slightly)
    switch (input.type) {
      case "text":
      case "number": // Added number type
      case "password": // Added password type
        return (
          <div key={input.name} className="mb-4"> {/* Reduced margin top */}
            <label htmlFor={input.name} className="block text-sm font-medium text-gray-300 mb-1">{input.label}</label>
            <input
              id={input.name} // Added id for label association
              name={input.name} // Added name attribute
              type={input.type} // Use dynamic type
              placeholder={input.placeholder || `Enter ${input.label.toLowerCase()}`}
              value={formValues[input.name] || ""}
              onChange={(e) => handleChange(e, input)}
               required={input.required} // Added required attribute support
              className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm border border-gray-600 focus:border-[#00ADEE] focus:ring-1 focus:ring-[#00ADEE] outline-none text-white placeholder-gray-400"
            />
          </div>
        );
      case "select":
        return (
          <div key={input.name} className="mb-4"> {/* Reduced margin top */}
            <label htmlFor={input.name} className="block text-sm font-medium text-gray-300 mb-1">{input.label}</label>
            <select
               id={input.name} // Added id
               name={input.name} // Added name
              value={formValues[input.name] || ""}
              onChange={(e) => handleChange(e, input)}
               required={input.required} // Added required attribute support
              className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm border border-gray-600 focus:border-[#00ADEE] focus:ring-1 focus:ring-[#00ADEE] outline-none appearance-none text-white"
               // Basic custom arrow styling
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="white" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em' }}
            >
               {/* Default empty/placeholder option */}
               <option value="" disabled={input.required}>
                    {input.placeholder || `Select ${input.label.toLowerCase()}`}
                </option>
                {input.options?.map((opt, i) => ( // Added optional chaining for safety
                    <option key={i} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
          </div>
        );
      case "checkbox":
        return (
          <div key={input.name} className="flex items-center gap-2 mt-3 mb-3"> {/* Adjusted margin */}
            <input
              type="checkbox"
              id={input.name} // Use name as id
              name={input.name} // Added name
              checked={!!formValues[input.name]} // Ensure boolean evaluation
              onChange={(e) => handleChange(e, input)}
              className="w-4 h-4 accent-[#00ADEE] cursor-pointer rounded border-gray-500 focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-[#00ADEE]"
            />
            {/* Link label to checkbox */}
            <label htmlFor={input.name} className="text-sm cursor-pointer select-none text-gray-300">{input.label}</label>
          </div>
        );
         case "textarea": // Added textarea type
             return (
                 <div key={input.name} className="mb-4">
                     <label htmlFor={input.name} className="block text-sm font-medium text-gray-300 mb-1">{input.label}</label>
                     <textarea
                         id={input.name}
                         name={input.name}
                         rows={input.rows || 4}
                         placeholder={input.placeholder || `Enter ${input.label.toLowerCase()}`}
                         value={formValues[input.name] || ""}
                         onChange={(e) => handleChange(e, input)}
                         required={input.required}
                         className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm border border-gray-600 focus:border-[#00ADEE] focus:ring-1 focus:ring-[#00ADEE] outline-none text-white placeholder-gray-400 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700"
                     />
                 </div>
             );
      default:
        console.warn(`Unsupported input type: ${input.type} for input: ${input.name}`);
        return null;
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setIsStylingResult(false);
    setResults(null); // Clear previous results

    // Build command string
    const command = toolConfig.buildCommand
      ? toolConfig.buildCommand(formValues)
      : toolConfig.command + " " + Object.entries(formValues)
        .filter(([key, value]) => value !== false && value !== '' && value !== null && value !== undefined) // More robust filtering
        .map(([key, value]) => {
             // Find the input config to check its type/prefix
             const inputConfig = toolConfig.config?.inputs?.find(i => i.name === key);
             const prefix = inputConfig?.prefix || '--'; // Default prefix or from config
             const separator = inputConfig?.separator || ' '; // Separator between flag and value

             if (inputConfig?.type === 'checkbox') {
                return value ? ` ${prefix}${key}` : ''; // Only include flag if checked
             } else {
                 // Include value only if it's not just a flag
                 return inputConfig?.isFlagOnly ? ` ${prefix}${key}` : ` ${prefix}${key}${separator}${value}`;
             }
         })
         .join("");


    // *** No direct terminal output here ***
    // addTerminalOutput("command", `$ ${command}`);

    try {
      const executeRes = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });

      let data;
      let rawOutput;

      if (!executeRes.ok) {
        let errorMsg = `Execution failed with status ${executeRes.status}`;
        let errorOutput = '';
        try {
          const errorData = await executeRes.json();
          errorMsg = errorData.error || errorMsg;
          errorOutput = errorData.output || '';
        } catch (e) {
          try {
             const errorText = await executeRes.text();
             if(errorText) errorMsg = errorText.substring(0, 200); // Get first part of text error
          } catch { /* Ignore text parsing error */ }
        }
         // *** Store error info for the results panel ***
         rawOutput = `Error: ${errorMsg}\n${errorOutput ? `Output:\n${errorOutput}` : ''}`;
         setResults({
             raw: rawOutput,
             processedMarkdown: rawOutput,
             styledHtml: `<p class="text-red-400 font-semibold">Execution Failed:</p><pre class="text-red-300 whitespace-pre-wrap break-words">${rawOutput}</pre>`
         });
         throw new Error(errorMsg); // Throw to exit the try block
      }

      // Handle response (assuming JSON or fallback to text)
       const contentType = executeRes.headers.get("content-type");
       if (contentType && contentType.includes("application/json")) {
            data = await executeRes.json();
            rawOutput = data.output || "No output received.";
       } else {
            rawOutput = await executeRes.text();
            if (!rawOutput) rawOutput = "No output received (non-JSON response).";
       }

      // *** No direct terminal output here ***
      // addTerminalOutput('output', rawOutput);

      let processedMarkdown = rawOutput;
      let styledHtml = `<pre class="whitespace-pre-wrap break-words">${rawOutput}</pre>`; // Default styling

      // --- Optional AI Processing ---
      if (toolConfig.aiProcessing && rawOutput && rawOutput.trim() !== "" && !rawOutput.startsWith("Error:")) {
        try {
          // AI Analysis Prompt (as before)
          const analysisPrompt = `Analyze the following ${toolConfig.name} output and provide concise insights:\n\`\`\`\n${rawOutput}\n\`\`\`\n${toolConfig.aiProcessingPrompt || ''}`;
          const analysisRes = await fetch("/api/chat", { /* ... */ body: JSON.stringify({ messages: [{ role: "user", content: analysisPrompt }] }) });
          if (analysisRes.ok) {
             const analysisData = await analysisRes.json();
             processedMarkdown = analysisData.content || rawOutput;
          } else { console.warn("AI analysis failed."); }
        } catch (analysisError) { console.error("Error in AI analysis:", analysisError); }
      }

      // --- Optional Result Processor ---
      if (toolConfig.processResult) {
        processedMarkdown = toolConfig.processResult(rawOutput, processedMarkdown);
      }

      // --- AI Styling Step ---
      if (processedMarkdown && processedMarkdown.trim() !== "" && !processedMarkdown.startsWith("Error:")) {
         setIsStylingResult(true);
          try {
               // Styling Prompt (as before)
               const stylingPrompt = `Format the following output as styled HTML... \n\`\`\`\n${processedMarkdown}\n\`\`\`\n...`;
               const styleRes = await fetch("/api/chat", { /* ... */ body: JSON.stringify({ messages: [{ role: "user", content: stylingPrompt }] }) });
               if (styleRes.ok) {
                 const styleData = await styleRes.json();
                 // Basic check if response looks like HTML
                  const potentialHtml = styleData.content || '';
                  if (potentialHtml.trim().startsWith('<') && potentialHtml.trim().endsWith('>')) {
                       styledHtml = potentialHtml;
                  } else {
                      // If AI didn't return HTML, wrap the processed markdown in <pre>
                      console.warn("AI styling did not return apparent HTML, using processed markdown.");
                      styledHtml = `<pre class="whitespace-pre-wrap break-words">${processedMarkdown}</pre>`;
                  }
               } else {
                 console.warn("AI styling failed.");
                  styledHtml = `<pre class="whitespace-pre-wrap break-words">${processedMarkdown}</pre>`; // Fallback to processed markdown
               }
          } catch (styleError) {
               console.error("Error styling results with AI:", styleError);
               styledHtml = `<pre class="text-orange-400 whitespace-pre-wrap break-words">Error during AI styling. Displaying processed output:\n\n${processedMarkdown}</pre>`; // Show error + processed markdown
          } finally {
               setIsStylingResult(false);
          }
      } else {
           // If there was no processed markdown (e.g., only raw error), use the initial styledHtml
           if (results?.styledHtml) { // Keep the error styling if it was set earlier
                styledHtml = results.styledHtml;
           }
      }

      // Update local results state for the UI panel
      setResults({ raw: rawOutput, processedMarkdown, styledHtml });

    } catch (error) {
       // Error handling within the try block already updated 'results' state.
       // Log the error for debugging but UI state is handled.
      console.error("Error during tool execution process:", error);
    } finally {
      setIsExecuting(false);
      // *** No direct terminal output here ***
      // addTerminalOutput("prompt", "root@vm:~# ");
    }
  };

   // Function to handle copying text
   const copyToClipboard = (text, type) => {
       navigator.clipboard.writeText(text).then(() => {
           setCopyStatus(`Copied ${type}!`);
           setTimeout(() => setCopyStatus(''), 1500); // Clear status after 1.5s
       }, (err) => {
           setCopyStatus(`Failed to copy ${type}`);
           console.error('Failed to copy text: ', err);
           setTimeout(() => setCopyStatus(''), 1500);
       });
   };

   // Check if any required field is empty
   const isAnyRequiredFieldEmpty = toolConfig.config?.inputs
       ?.filter(input => input.required) // Get only required inputs
       .some(input => { // Check if any of them are empty/falsy
            // Also consider visibility - don't block if a required field is hidden
            if (input.visibleWhen) {
                 const controllingFieldValue = formValues[input.visibleWhen.field];
                 if (
                    (input.visibleWhen.value !== undefined && controllingFieldValue !== input.visibleWhen.value) ||
                    (input.visibleWhen.isChecked !== undefined && !!controllingFieldValue !== input.visibleWhen.isChecked) ||
                    (input.visibleWhen.isSet !== undefined && input.visibleWhen.isSet && !controllingFieldValue) ||
                    (input.visibleWhen.isNotSet !== undefined && input.visibleWhen.isNotSet && !!controllingFieldValue)
                ) {
                    return false; // Don't consider this hidden required field as empty
                 }
            }
            return !formValues[input.name]; // Check if the value is falsy
       });

  return (
    // Overall container ensures content fills height and allows scrolling
    <div className="h-full flex flex-col bg-gray-800 text-white rounded-lg overflow-hidden"> {/* Use rounded-lg if window applies padding */}

      {/* Header */}
      <div className="flex justify-between items-start p-4 border-b border-[#00ADEE]/50 bg-gray-850 flex-shrink-0">
        <div className="flex-grow min-w-0">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-[#00ADEE] truncate">
             {/* Render tool icon if it's a valid React element */}
             {toolConfig.icon && typeof toolConfig.icon === 'object' && React.isValidElement(toolConfig.icon)
                ? React.cloneElement(toolConfig.icon, { size: 24 })
                : <Bot size={24} /> /* Fallback icon */
             }
             <span className="truncate">{toolConfig.name}</span>
          </h3>
          {/* AI Generated Description */}
          <div className="text-xs text-blue-200/80 mt-1 flex items-center gap-1.5 min-h-[16px] pl-8"> {/* Indent description */}
            {isDescriptionLoading ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Loading description...
              </>
            ) : aiDescription.startsWith("Error") ? (
                 <span className="text-orange-400">{aiDescription}</span>
             ) : (
              <>
                 {/* Using a different icon for AI description */}
                 <Bot size={12} className="text-blue-300 flex-shrink-0" /> <span>{aiDescription}</span>
              </>
            )}
          </div>
        </div>
        {/* Use the onClose prop passed by the Window component */}
        <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full h-7 w-7 flex items-center justify-center flex-shrink-0 ml-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-850 focus:ring-red-500"
            aria-label="Close Tool"
            title="Close"
        >
          <CloseIcon size={18} />
        </button>
      </div>

      {/* Content Area (Main part, scrollable) */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4"> {/* Adjusted breakpoint */}

          {/* Left Column – Dynamic Form */}
          <div className="space-y-1"> {/* Reduced space between inputs slightly */}
            <h4 className="text-lg font-medium mb-3 text-gray-200 border-b border-gray-600 pb-1">Configuration</h4>
             {/* Defensive check for config and inputs */}
             {toolConfig.config?.inputs?.length > 0 ? (
                 toolConfig.config.inputs.map((input) => renderInput(input))
             ) : (
                 <p className="text-sm text-gray-400 italic mt-2">No configuration options available for this tool.</p>
             )}
          </div>

          {/* Right Column – Results */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 flex flex-col min-h-[300px] max-h-[70vh]"> {/* Added max-height */}
            <h4 className="text-lg font-medium mb-2 text-gray-200 flex-shrink-0">Results</h4>
            {isExecuting || isStylingResult ? (
              <div className="flex-1 flex items-center justify-center text-gray-300">
                <div className="text-center">
                  <Loader2 size={32} className={`animate-spin ${isStylingResult ? 'text-blue-400' : 'text-[#00ADEE]'} mb-3 mx-auto`} />
                  <p className="text-base">{isStylingResult ? 'AI Formatting...' : 'Executing...'}</p>
                </div>
              </div>
            ) : results ? (
              <div className="flex-1 flex flex-col min-h-0"> {/* Ensure flex container takes remaining space */}
                {/* Action Buttons */}
                <div className="flex gap-2 mb-2 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(results.raw, 'Raw Output')}
                    title="Copy raw output to clipboard"
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-xs flex items-center gap-1 text-white transition-colors"
                  >
                    <Copy size={14} /> Copy Raw
                  </button>
                  {/* Removed Save button for now */}
                  {/* Feedback Message */}
                  {copyStatus && <span className="text-xs text-green-400 flex items-center">{copyStatus}</span>}
                </div>
                 {/* Styled HTML Output Area */}
                 {/* Added prose styles for better typography from markdown/html */}
                 <div className="prose prose-sm prose-invert max-w-none flex-1 overflow-y-auto bg-gray-800/70 p-3 rounded-md shadow-inner border border-gray-600/50 text-gray-200 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50">
                    {/* Sanitize the AI-generated HTML before rendering */}
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(results.styledHtml) }} />
                 </div>
              </div>
            ) : (
               // Placeholder when no results yet
               <div className="flex-1 flex items-center justify-center text-gray-400/80 bg-gray-800/30 rounded-md border border-dashed border-gray-600/50 p-4">
                 <div className="text-center">
                   <Bot size={36} className="text-gray-500 mb-3 mx-auto" />
                   <p className="text-sm">Run the tool to see results here.</p>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
       <div className="px-4 py-3 border-t border-[#00ADEE]/50 flex-shrink-0 bg-gray-850">
           {/* Add a check for required fields */}
           <button
             onClick={handleExecute}
             disabled={isExecuting || isStylingResult || isAnyRequiredFieldEmpty}
             className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-base font-medium ${
               (isExecuting || isStylingResult)
                 ? "bg-blue-700/50 text-blue-300 cursor-wait" // Use cursor-wait
                 : isAnyRequiredFieldEmpty
                 ? "bg-gray-600/70 text-gray-400 cursor-not-allowed" // Indicate disabled due to missing required field
                 : "bg-gradient-to-r from-[#00ADEE] to-[#0090C5] hover:from-[#0090C5] hover:to-[#00ADEE] text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-850 focus:ring-[#00ADEE]"
             } transition-all duration-150 ease-in-out shadow-md disabled:opacity-70`}
             title={isAnyRequiredFieldEmpty ? "Please fill in all required fields" : `Run ${toolConfig.name}`}
           >
             {(isExecuting || isStylingResult) ? (
               <>
                 <Loader2 className="animate-spin" size={20} /> Processing...
               </>
             ) : (
               <>Launch {toolConfig.name}</>
             )}
           </button>
           {isAnyRequiredFieldEmpty && <p className="text-xs text-orange-400 text-center mt-1.5">Please fill in all required fields marked with * (if any).</p>}
         </div>
    </div>
  );
}