"use client";

import { useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { challengesConfig } from '@/public/challengesConfig'; // Adjust path if needed
import { TerminalContext } from '../contexts/TerminalContext';
import { useAIChat } from "../contexts/AIChatContext";
import { Play, StopCircle, ChevronDown, ChevronUp, Loader2, Info } from 'lucide-react';

// --- API Interaction Layer (Using fetch) ---
const API_BASE_URL = '/api/challenges/manage'; // Use the new API route

/**
 * Represents the state of the currently running challenge.
 * @typedef {object} ActiveChallenge
 * @property {string} id - The unique ID of the challenge.
 * @property {string | null} [ip] - The IP address of the victim machine, if available.
 */

export default function ChallengeLabs() {
  // Context Hooks
  const { addTerminalOutput } = useContext(TerminalContext);
  const { addMessage } = useAIChat();

  // Component State
  const [expandedLevelId, setExpandedLevelId] = useState(null);
  /** @type {[ActiveChallenge | null, Function]} */
  const [currentChallenge, setCurrentChallenge] = useState(null); // Manages the currently active challenge
  const [isLoading, setIsLoading] = useState(false); // Tracks loading state for API calls
  const [error, setError] = useState(null); // Stores and displays error messages

  const handleStart = useCallback(async (level) => {
    // Prevent starting if another challenge is running or if already starting/stopping
    if (isLoading) return;
    if (currentChallenge && currentChallenge.id !== level.id) {
      setError("Another challenge is already running. Please stop it first.");
      return;
    }
    // Avoid restarting if it's already the current one
    if (currentChallenge && currentChallenge.id === level.id) {
      addTerminalOutput('system', `Challenge ${level.name} is already running at IP: ${currentChallenge.ip || 'N/A'}.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    addTerminalOutput('system', `Starting challenge environment for: ${level.name}...`);

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'start',
            challengeId: level.id,
            victimImage: level.victimImage
        }),
      });

      const result = await response.json(); // Always parse JSON, even for errors

      if (!response.ok) {
        // Use error message from API response if available, otherwise use status text
        throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        setCurrentChallenge({ id: level.id, ip: result.ip || null }); // Update state
        addTerminalOutput('system', `Challenge "${level.name}" started successfully.`);
        if (result.ip) {
          addTerminalOutput('system', `Target IP: ${result.ip}`);
        } else {
            addTerminalOutput('warning', `Challenge started, but no IP address was returned.`);
        }
      } else {
        // Handle cases where response.ok is true but API reports failure
        throw new Error(result.message || 'Failed to start challenge environment.');
      }
    } catch (err) {
      console.error("Error starting challenge:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'An unexpected error occurred while starting the challenge.');
      addTerminalOutput('error', `Error starting challenge: ${errorMessage}`);
      setCurrentChallenge(null); // Clear state on failure
    } finally {
      setIsLoading(false);
    }
  }, [currentChallenge, isLoading, addTerminalOutput, setCurrentChallenge, setError, setIsLoading]); // Dependencies for useCallback

  const handleStop = useCallback(async () => {
    if (!currentChallenge || isLoading) return; // No challenge to stop or already busy

    setIsLoading(true);
    setError(null);
    const levelIdToStop = currentChallenge.id;
    // Find the level details for logging purposes
    const levelName = challengesConfig.levels.find(l => l.id === levelIdToStop)?.name || levelIdToStop;
    addTerminalOutput('system', `Stopping challenge environment for: ${levelName}...`);

    try {
       const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'stop',
                challengeId: levelIdToStop
            }),
        });

        const result = await response.json(); // Always parse JSON

      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        addTerminalOutput('system', `Challenge "${levelName}" stopped successfully.`);
        setCurrentChallenge(null); // Clear the active challenge state
      } else {
        throw new Error(result.message || 'Failed to stop challenge environment.');
      }
    } catch (err) {
      console.error("Error stopping challenge:", err);
       const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'An unexpected error occurred while stopping the challenge.');
      addTerminalOutput('error', `Error stopping challenge: ${errorMessage}`);
      // Keep state as is on failure
    } finally {
      setIsLoading(false);
    }
  }, [currentChallenge, isLoading, addTerminalOutput, setCurrentChallenge, setError, setIsLoading]);

  const toggleExpand = useCallback((levelId) => {
    setExpandedLevelId(prevId => (prevId === levelId ? null : levelId));
  }, [setExpandedLevelId]);

  const getHint = useCallback(async (level) => {
    const prompt = `Provide a subtle hint for the "${level.name}" cybersecurity challenge. The objectives are: ${level.objectives.join(', ')}. Do not give away the answer or the flag format, just a small nudge in the right direction focusing on the initial steps or common pitfalls.`;
    addMessage(prompt);
  }, [addMessage]);


  // --- Render Logic ---
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-[#00ADEE] mb-6">Challenge Labs</h1>

      {/* Error Display Area */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300 border border-red-500"
            role="alert"
          >
            <span className="font-medium">Error:</span> {error}
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Active Challenge Status Display */}
      <AnimatePresence>
        {currentChallenge && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="p-4 mb-6 bg-blue-900/30 border border-blue-500/50 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden"
          >
            <div>
              <p className="text-lg font-semibold text-blue-300">
                Active Challenge: {challengesConfig.levels.find(l => l.id === currentChallenge.id)?.name || currentChallenge.id}
              </p>
              {currentChallenge.ip && (
                <p className="text-sm text-gray-400">
                  Target IP: <code className="bg-gray-700 px-1 rounded">{currentChallenge.ip}</code>
                </p>
              )}
            </div>
            <button
              onClick={handleStop}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-white transition-colors w-full sm:w-auto ${
                isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <StopCircle size={18} />}
              Stop Challenge
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List of Challenges */}
      <div className="space-y-4">
        {challengesConfig.levels.map((level) => {
          const isExpanded = expandedLevelId === level.id;
          const isActive = currentChallenge?.id === level.id;
          const isStartDisabled = isLoading || (!!currentChallenge && !isActive);

          return (
            <div
              key={level.id}
              className={`bg-gray-800 rounded-lg border ${
                isActive ? 'border-blue-500 shadow-lg' : 'border-gray-700'
              } overflow-hidden`}
            >
              {/* Clickable Header */}
              <div
                className="p-4 cursor-pointer flex items-center justify-between gap-4"
                onClick={() => toggleExpand(level.id)}
                aria-expanded={isExpanded}
                aria-controls={`challenge-details-${level.id}`}
              >
                {/* Header content */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={`flex-shrink-0 p-1.5 rounded ${
                      isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {level.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2
                      className={`text-xl font-semibold truncate ${isActive ? 'text-blue-300' : 'text-white'}`}
                    >
                      {level.name}
                    </h2>
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                      level.difficulty === 'Easy'
                        ? 'bg-green-700 text-green-200'
                        : level.difficulty === 'Medium'
                        ? 'bg-yellow-700 text-yellow-200'
                        : 'bg-red-700 text-red-200'
                    }`}
                  >
                    {level.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {isActive && (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Running
                    </span>
                  )}
                  {/* Animate the chevron rotation */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </div>
              </div>

              {/* Expandable Details Section */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key={`content-${level.id}`}
                    id={`challenge-details-${level.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: 'auto', 
                      opacity: 1,
                      transition: { 
                        height: { duration: 0.3 }, 
                        opacity: { duration: 0.25, delay: 0.05 } 
                      }
                    }}
                    exit={{ 
                      height: 0, 
                      opacity: 0,
                      transition: { 
                        height: { duration: 0.3 }, 
                        opacity: { duration: 0.2 } 
                      } 
                    }}
                    className="border-t border-gray-700 overflow-hidden"
                    style={{ originY: 0 }}
                  >
                    <div className="p-4 space-y-4">
                      <p className="text-gray-300">{level.description}</p>

                      <div>
                        <h4 className="font-semibold mb-2 text-blue-300">Objectives:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-400">
                          {level.objectives.map((obj) => (
                            <li key={obj}>{obj}</li>
                          ))}
                        </ul>
                      </div>

                      {level.tags && level.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <h4 className="font-semibold text-blue-300 w-full mb-1 text-sm">Tags:</h4>
                          {level.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 pt-2">
                        {!isActive && (
                          <button
                            onClick={() => handleStart(level)}
                            disabled={isStartDisabled}
                            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-white transition-colors ${
                              isStartDisabled
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-green-600 hover:bg-green-500'
                            }`}
                          >
                            {isLoading && !currentChallenge ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Play size={18} />
                            )}
                            Start Challenge
                          </button>
                        )}
                        <button
                          onClick={() => getHint(level)}
                          disabled={isLoading}
                          className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-white transition-colors ${
                            isLoading
                              ? 'bg-gray-600 cursor-not-allowed opacity-50'
                              : 'bg-blue-600 hover:bg-blue-500'
                          }`}
                          title="Ask AI for a hint"
                        >
                          <Info size={18} /> Get Hint (AI)
                        </button>
                      </div>
                      {isStartDisabled && !!currentChallenge && !isActive && (
                        <p className="text-xs text-yellow-400 mt-2">
                          Stop the active challenge ('
                          {challengesConfig.levels.find((l) => l.id === currentChallenge.id)?.name ||
                            currentChallenge.id}
                          ') before starting a new one.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}