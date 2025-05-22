// app/components/DynamicTools.js
"use client";

import React, { useState, useEffect } from "react";
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Bot, Loader2, Save, Copy, X as CloseIcon } from "lucide-react";

export default function DynamicTools({ toolConfig, onClose, windowId }) {
    console.log(`Rendering DynamicTools component for: ${toolConfig?.name || 'Unknown Tool'}`);

    // --- State Hooks ---
    const [formValues, setFormValues] = useState(() => {
        const initialState = {};
        toolConfig?.config?.inputs?.forEach(input => {
            initialState[input.name] = toolConfig.initialValues?.[input.name] ?? input.defaultValue ?? '';
            if (input.type === 'checkbox') {
                initialState[input.name] = toolConfig.initialValues?.[input.name] ?? input.defaultValue ?? false;
            }
        });
        return initialState;
    });
    const [isExecuting, setIsExecuting] = useState(false);
    const [results, setResults] = useState(null);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [copyStatus, setCopyStatus] = useState('');

    // --- Effect Hook ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            console.log("DynamicTools: useEffect running to configure DOMPurify and Marked...");
            try {
                DOMPurify.setConfig({
                    USE_PROFILES: { html: true },
                });
                marked.setOptions({
                    gfm: true,
                    breaks: true,
                    sanitize: false,
                });
                 console.log("DynamicTools: DOMPurify and Marked configured successfully.");
            } catch (configError) {
                console.error("DynamicTools: Error configuring DOMPurify/Marked:", configError);
            }
        } else {
             console.log("DynamicTools: useEffect running on server? Skipping client-side config.");
        }
        return () => {
             console.log("DynamicTools: useEffect cleanup.");
        };
    }, []);

    // --- Event Handlers & Render Logic ---
    const handleChange = (e, input) => {
        if (!input || !input.name) return;
        const value = input.type === "checkbox" ? e.target.checked : e.target.value;
        setFormValues((prev) => ({ ...prev, [input.name]: value }));
    };

    const renderInput = (input) => {
        // ... (input rendering logic - same as before) ...
        if (!input || !input.name) return null;

        // Conditional Visibility Logic
        if (input.visibleWhen) {
            const controllingFieldValue = formValues[input.visibleWhen.field];
            let isHidden = false;
            if (input.visibleWhen.value !== undefined && controllingFieldValue !== input.visibleWhen.value) isHidden = true;
            else if (input.visibleWhen.isChecked !== undefined && !!controllingFieldValue !== input.visibleWhen.isChecked) isHidden = true;
            else if (input.visibleWhen.isSet !== undefined && input.visibleWhen.isSet && !controllingFieldValue) isHidden = true;
            else if (input.visibleWhen.isNotSet !== undefined && input.visibleWhen.isNotSet && !!controllingFieldValue) isHidden = true;

            if (isHidden) return null;
        }

        // Input Type Rendering
        switch (input.type) {
            case "text":
            case "number":
            case "password":
                return (
                    <div key={input.name} className="mb-4">
                    <label htmlFor={input.name} className="block text-sm font-medium text-gray-300 mb-1">
                        {input.label} {input.required && <span className="text-red-400">*</span>}
                    </label>
                    <input
                        id={input.name}
                        name={input.name}
                        type={input.type}
                        placeholder={input.placeholder || `Enter ${input.label?.toLowerCase()}`}
                        value={formValues[input.name] || ""}
                        onChange={(e) => handleChange(e, input)}
                        required={input.required}
                        className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm border border-gray-600 focus:border-[#00ADEE] focus:ring-1 focus:ring-[#00ADEE] outline-none text-white placeholder-gray-400"
                        min={input.min}
                        max={input.max}
                    />
                    </div>
                );
            case "select":
                return (
                    <div key={input.name} className="mb-4">
                        <label htmlFor={input.name} className="block text-sm font-medium text-gray-300 mb-1">
                            {input.label} {input.required && <span className="text-red-400">*</span>}
                        </label>
                        <select
                            id={input.name}
                            name={input.name}
                            value={formValues[input.name] || ""}
                            onChange={(e) => handleChange(e, input)}
                            required={input.required}
                            className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm border border-gray-600 focus:border-[#00ADEE] focus:ring-1 focus:ring-[#00ADEE] outline-none appearance-none text-white"
                            style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="white" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em' }}
                        >
                            <option value="" disabled={!input.required}>
                                {input.placeholder || `Select ${input.label?.toLowerCase()}`}
                            </option>
                            {input.options?.map((opt, i) => (
                                <option key={i} value={opt.value}>
                                {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            case "checkbox":
                return (
                    <div key={input.name} className="flex items-center gap-2 mt-3 mb-3">
                        <input
                            type="checkbox"
                            id={input.name}
                            name={input.name}
                            checked={!!formValues[input.name]}
                            onChange={(e) => handleChange(e, input)}
                            className="w-4 h-4 accent-[#00ADEE] cursor-pointer rounded border-gray-500 focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-[#00ADEE]"
                        />
                        <label htmlFor={input.name} className="text-sm cursor-pointer select-none text-gray-300">{input.label}</label>
                    </div>
                );
            case "textarea":
                return (
                    <div key={input.name} className="mb-4">
                        <label htmlFor={input.name} className="block text-sm font-medium text-gray-300 mb-1">
                            {input.label} {input.required && <span className="text-red-400">*</span>}
                        </label>
                        <textarea
                            id={input.name}
                            name={input.name}
                            rows={input.rows || 4}
                            placeholder={input.placeholder || `Enter ${input.label?.toLowerCase()}`}
                            value={formValues[input.name] || ""}
                            onChange={(e) => handleChange(e, input)}
                            required={input.required}
                            className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm border border-gray-600 focus:border-[#00ADEE] focus:ring-1 focus:ring-[#00ADEE] outline-none text-white placeholder-gray-400 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700"
                        />
                    </div>
                );
            case "info":
                return (
                    <div key={input.name} className="mb-4 mt-2 p-3 bg-sky-900/40 border border-sky-700/60 rounded-md shadow-inner">
                        <p className="text-sm text-sky-200/90">{input.label}</p>
                    </div>
                );
            default:
                console.warn(`Unsupported input type: ${input.type} for input: ${input.name}`);
                return null;
        }
    };


    const handleExecute = async () => {
        console.log("DynamicTools: handleExecute triggered.");
        setIsExecuting(true);
        setIsProcessingAI(false);
        setResults(null);

        const command = toolConfig.buildCommand ? toolConfig.buildCommand(formValues) : "";

        if (!command || command.startsWith("echo 'Error:")) {
            const errorMsg = command || "Error: Command could not be generated.";
            const displayError = errorMsg.replace("echo 'Error: ", "").replace("'", "");
            console.error("DynamicTools: Command generation error:", displayError);
            setResults({
                raw: displayError,
                processedMarkdown: displayError,
                styledHtml: `<p class="text-red-400 font-semibold">Configuration Error:</p><pre class="text-red-300">${displayError}</pre>`
            });
            setIsExecuting(false);
            return;
        }

        console.log(`DynamicTools: Executing command: ${command}`);
        let rawOutput = '';
        let executionError = null;

        // --- Step 1: Execute the command ---
        try {
            const executeRes = await fetch("/api/execute", { // Hits the command execution backend
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command }),
            });
            // ... (error handling for executeRes - same as before) ...
            if (!executeRes.ok) {
                let errorMsg = `Execution failed with status ${executeRes.status}`;
                let errorOutputContent = '';
                try {
                    const errorData = await executeRes.json();
                    errorMsg = errorData.error || errorMsg;
                    errorOutputContent = errorData.output || '';
                    console.error(`DynamicTools: Execution API Error ${executeRes.status}:`, errorData);
                } catch (e) {
                    console.error(`DynamicTools: Execution API Error ${executeRes.status} (non-JSON response)`);
                 }
                executionError = `Error: ${errorMsg}\n${errorOutputContent ? `Output:\n${errorOutputContent}` : ''}`;
                rawOutput = executionError;
            } else {
                 try {
                    const data = await executeRes.json();
                    rawOutput = data.output !== undefined ? String(data.output) : "No output received.";
                    console.log("DynamicTools: Raw output received:", rawOutput.substring(0, 100) + "...");
                 } catch(jsonError) {
                    console.warn("DynamicTools: Execution response was not JSON, reading as text.");
                    try {
                         rawOutput = await executeRes.text();
                         if (!rawOutput) rawOutput = "No output received (empty text response)."
                         console.log("DynamicTools: Raw output received (text):", rawOutput.substring(0, 100) + "...");
                    } catch (textError) {
                         rawOutput = "Failed to read execution response.";
                         executionError = "Failed to read execution response.";
                         console.error("DynamicTools: Error reading text response:", textError);
                    }
                 }
            }

        } catch (error) {
            console.error("DynamicTools: Network or fetch error during execution:", error);
            executionError = `Network or processing error: ${error.message}`;
            rawOutput = executionError;
        }

        setIsExecuting(false); // Command execution finished

        // --- Step 2: Process with AI (using /api/chat) ---
        let processedMarkdown = rawOutput; // Default to raw output
        let styledHtml = ''; // Initialize styledHtml

        if (!executionError && toolConfig.aiProcessing?.prompt && rawOutput) {
            console.log("DynamicTools: Starting AI processing via /api/chat...");
            setIsProcessingAI(true);
            try {
                // Create the prompt using the template from toolConfig
                const promptContent = toolConfig.aiProcessing.prompt.replace('{output}', rawOutput);
                console.log("DynamicTools: Sending prompt to /api/chat:", promptContent.substring(0, 200) + "...");

                // ** CHANGE 1: Use the correct endpoint URL **
                // ** CHANGE 2: Format the request body for /api/chat **
                const aiRes = await fetch("/api/chat", { // <-- CHANGED URL
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: [{ role: 'user', content: promptContent }] // <-- CHANGED BODY STRUCTURE
                    }),
                });

                if (!aiRes.ok) {
                    // Handle errors reported by the /api/chat route
                    let aiErrorMsg = `AI processing failed via /api/chat with status ${aiRes.status}`;
                    try {
                        const errorData = await aiRes.json(); // /api/chat should return JSON errors
                        aiErrorMsg = errorData.error || errorData.message || aiErrorMsg; // Use error field if available
                        console.error(`DynamicTools: /api/chat Error ${aiRes.status}:`, errorData);
                    } catch (e) {
                         console.error(`DynamicTools: /api/chat Error ${aiRes.status} (non-JSON response)`);
                    }
                    processedMarkdown = `${rawOutput}\n\n---\n*AI processing failed: ${aiErrorMsg}*`;
                } else {
                    const aiData = await aiRes.json();
                    // ** CHANGE 3: Extract response from the 'content' field **
                    processedMarkdown = aiData.content || rawOutput; // <-- Use aiData.content
                    console.log("DynamicTools: AI processed content received from /api/chat:", processedMarkdown.substring(0, 100) + "...");
                }
            } catch (aiError) {
                console.error("DynamicTools: Error calling /api/chat endpoint:", aiError);
                processedMarkdown = `${rawOutput}\n\n---\n*Error connecting to AI processing service: ${aiError.message}*`;
            } finally {
                setIsProcessingAI(false);
                console.log("DynamicTools: AI processing finished.");
            }
        } else {
             // Logging why AI step was skipped (same as before)
             if (executionError) console.log("DynamicTools: Skipping AI processing due to execution error.");
             else if (!toolConfig.aiProcessing?.prompt) console.log("DynamicTools: Skipping AI processing as no prompt is configured.");
             else if (!rawOutput) console.log("DynamicTools: Skipping AI processing as there was no raw output.");
        }

        // --- Step 3: Convert Markdown to HTML and Sanitize ---
        console.log("DynamicTools: Converting Markdown and sanitizing...");
        try {
            let htmlFromMarkdown = '';
            if (typeof marked === 'function') {
                htmlFromMarkdown = marked.parse(processedMarkdown || '');
            } else {
                console.error("DynamicTools: Marked library not loaded correctly.");
                htmlFromMarkdown = `<pre>${processedMarkdown || ''}</pre>`;
            }

            if (typeof window !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
               styledHtml = DOMPurify.sanitize(htmlFromMarkdown);
               console.log("DynamicTools: HTML Sanitized.");
            } else {
               console.warn("DynamicTools: DOMPurify not available or running server-side. Skipping sanitization.");
               styledHtml = htmlFromMarkdown;
            }

            // Override if there was an error earlier or no output
            if (executionError) {
                styledHtml = `<p class="text-red-400 font-semibold">Execution Failed:</p><pre class="text-red-300 whitespace-pre-wrap break-words">${executionError}</pre>`;
            } else if (!processedMarkdown?.trim()) {
                styledHtml = `<p class="text-gray-400 italic">Execution successful, but no output was generated or processed.</p>`;
            }

        } catch (renderError) {
            console.error("DynamicTools: Error during Markdown parsing or sanitization:", renderError);
            styledHtml = `<p class="text-orange-400">Error rendering results:</p><pre class="whitespace-pre-wrap break-words">${processedMarkdown || ''}</pre>`;
        }

        // --- Step 4: Update Results State ---
        console.log("DynamicTools: Updating results state.");
        setResults({ raw: rawOutput, processedMarkdown, styledHtml });
    };


    const copyToClipboard = (text, type) => {
        // ... (copy logic - same as before) ...
        if (!navigator.clipboard) {
            console.error("Clipboard API not available.");
            setCopyStatus('Copy not supported');
            setTimeout(() => setCopyStatus(''), 1500);
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            setCopyStatus(`Copied ${type}!`);
            setTimeout(() => setCopyStatus(''), 1500);
        }, (err) => {
            setCopyStatus(`Failed to copy ${type}`);
            console.error('Failed to copy text: ', err);
            setTimeout(() => setCopyStatus(''), 1500);
        });
    };

    const isAnyRequiredFieldEmpty = toolConfig?.config?.inputs
        ?.filter(input => {
            // ... (validation logic - same as before) ...
            if (!input.required) return false;
            if (input.visibleWhen) {
                const controllingFieldValue = formValues[input.visibleWhen.field];
                let isHidden = false;
                if (input.visibleWhen.value !== undefined && controllingFieldValue !== input.visibleWhen.value) isHidden = true;
                else if (input.visibleWhen.isChecked !== undefined && !!controllingFieldValue !== input.visibleWhen.isChecked) isHidden = true;
                else if (input.visibleWhen.isSet !== undefined && input.visibleWhen.isSet && !controllingFieldValue) isHidden = true;
                else if (input.visibleWhen.isNotSet !== undefined && input.visibleWhen.isNotSet && !!controllingFieldValue) isHidden = true;
                if (isHidden) return false;
            }
            const value = formValues[input.name];
             return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
        })
        .some(input => true);

    // --- JSX Return ---
    return (
        // ... (JSX structure - same as before) ...
        <div className="h-full flex flex-col bg-gray-800 text-white overflow-hidden">

            {/* Header Section */}
            <div className="flex justify-between items-center p-4 border-b border-[#00ADEE]/50 bg-gray-850 flex-shrink-0">
                 <div className="flex items-center gap-3 min-w-0">
                    {toolConfig.icon && typeof toolConfig.icon === 'object' && React.isValidElement(toolConfig.icon)
                        ? React.cloneElement(toolConfig.icon, { size: 24, className: "text-[#00ADEE] flex-shrink-0" })
                        : <Bot size={24} className="text-[#00ADEE] flex-shrink-0" />
                    }
                    <div className="flex flex-col min-w-0">
                        <h3 className="text-lg font-semibold text-[#00ADEE] leading-tight truncate">
                            {toolConfig.name || "Tool"}
                        </h3>
                        {toolConfig.description && (
                            <p className="text-xs text-gray-400 leading-tight truncate">
                                {toolConfig.description}
                            </p>
                        )}
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-700 transition-colors ml-2 flex-shrink-0"
                        aria-label="Close"
                    >
                        <CloseIcon size={18} className="text-gray-400 hover:text-white" />
                    </button>
                )}
            </div>

            {/* Content Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">

                    {/* Left Column – Dynamic Form */}
                    <div className="space-y-1">
                        <h4 className="text-lg font-medium mb-3 text-gray-200 border-b border-gray-600 pb-1">Configuration</h4>
                        {toolConfig?.config?.inputs?.length > 0 ? (
                            toolConfig.config.inputs.map((input, index) => renderInput(input) || <React.Fragment key={`empty-${input?.name || index}`}></React.Fragment> )
                        ) : (
                            <p className="text-sm text-gray-400 italic mt-2">No configuration options available for this tool.</p>
                        )}
                    </div>

                    {/* Right Column – Results */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 flex flex-col min-h-[300px] max-h-[75vh]">
                        <h4 className="text-lg font-medium mb-2 text-gray-200 flex-shrink-0">Results</h4>
                        {isExecuting || isProcessingAI ? (
                            <div className="flex-1 flex items-center justify-center text-gray-300">
                                <div className="text-center">
                                    <Loader2 size={32} className={`animate-spin ${isProcessingAI ? 'text-purple-400' : 'text-[#00ADEE]'} mb-3 mx-auto`} />
                                    <p className="text-base">{isProcessingAI ? 'Processing with AI...' : 'Executing Command...'}</p>
                                </div>
                            </div>
                        ) : results ? (
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex gap-2 mb-2 flex-shrink-0 items-center justify-between">
                                     <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={() => copyToClipboard(results.raw, 'Raw Output')}
                                            title="Copy raw command output"
                                            className="px-2.5 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-xs flex items-center gap-1 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
                                        >
                                            <Copy size={14} /> Copy Raw
                                        </button>
                                        {results.processedMarkdown && results.processedMarkdown !== results.raw && (
                                             <button
                                                onClick={() => copyToClipboard(results.processedMarkdown, 'AI Summary (Markdown)')}
                                                title="Copy AI summary as Markdown"
                                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded-md text-xs flex items-center gap-1 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                                            >
                                                <Copy size={14} /> Copy Summary
                                            </button>
                                        )}
                                     </div>
                                    {copyStatus && <span className="text-xs text-green-400 flex items-center flex-shrink-0">{copyStatus}</span>}
                                </div>

                                {/* Styled HTML Output Area */}
                                <div className="flex-1 overflow-y-auto bg-gray-800/70 p-3 rounded-md shadow-inner border border-gray-600/50 text-gray-200 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50">
                                    <div
                                        className="prose prose-sm prose-invert max-w-none
                                                   prose-headings:text-sky-300 prose-headings:border-b prose-headings:border-sky-800 prose-headings:pb-1
                                                   prose-a:text-blue-400 hover:prose-a:text-blue-300
                                                   prose-strong:text-sky-200
                                                   prose-code:text-amber-300 prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                                                   prose-pre:bg-gray-900 prose-pre:p-3 prose-pre:rounded-md prose-pre:text-sm prose-pre:scrollbar-thin prose-pre:scrollbar-thumb-gray-600 prose-pre:scrollbar-track-gray-900
                                                   prose-blockquote:border-l-sky-600 prose-blockquote:text-sky-200/90 prose-blockquote:italic
                                                   prose-ul:list-disc prose-ul:ml-5
                                                   prose-ol:list-decimal prose-ol:ml-5
                                                   prose-li:my-1"
                                        dangerouslySetInnerHTML={{ __html: results.styledHtml }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400/80 bg-gray-800/30 rounded-md border border-dashed border-gray-600/50 p-4">
                                <div className="text-center">
                                    <Bot size={36} className="text-gray-500 mb-3 mx-auto" />
                                    <p className="text-sm">Run the tool to see the results here.</p>
                                    <p className="text-xs text-gray-500 mt-1">(Configure options and click Launch)</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Controls */}
            <div className="px-4 py-3 border-t border-[#00ADEE]/50 flex-shrink-0 bg-gray-850">
                <button
                    onClick={handleExecute}
                    disabled={isExecuting || isProcessingAI || isAnyRequiredFieldEmpty}
                    className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-base font-medium ${
                        (isExecuting || isProcessingAI)
                            ? "bg-blue-700/50 text-blue-300 cursor-wait"
                            : isAnyRequiredFieldEmpty
                            ? "bg-gray-600/70 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-[#00ADEE] to-[#0090C5] hover:from-[#0090C5] hover:to-[#00ADEE] text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-850 focus:ring-[#00ADEE]"
                    } transition-all duration-150 ease-in-out shadow-md disabled:opacity-70`}
                     title={isAnyRequiredFieldEmpty ? "Please fill in all required fields marked with *" : `Run ${toolConfig?.name || 'Tool'}`}
                >
                    {(isExecuting || isProcessingAI) ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            {isProcessingAI ? 'Processing AI...' : 'Executing...'}
                        </>
                    ) : (
                        <>Launch {toolConfig?.name || 'Tool'}</>
                    )}
                </button>
                {isAnyRequiredFieldEmpty && !(isExecuting || isProcessingAI) && (
                    <p className="text-xs text-orange-400 text-center mt-1.5">
                        Please fill in all required fields marked with <span className="text-red-400 font-semibold">*</span>.
                    </p>
                )}
            </div>
        </div>
    );
}