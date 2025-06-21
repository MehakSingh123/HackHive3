// app/components/EthicalHackingStages.js
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Eye, ScanLine, KeyRound, CheckCircle, AlertTriangle, Loader, Info, X } from 'lucide-react';
import Typewriter from './Typewriter'; // Adjust path if needed

// Define the stages of ethical hacking (same structure as before)
const hackingStages = [
    {
        id: 'recon',
        name: 'Reconnaissance',
        icon: Eye,
        descriptionPrompt: "Generate a concise description (around 30-40 words) for the Reconnaissance (Information Gathering) stage of ethical hacking. Focus on its purpose: passively and actively collecting information about a target system or network before any active intrusion attempt. Mention examples like footprinting or OSINT. Start directly with the description.",
        tools: ['Nmap', 'OSINT', 'theHarvester', 'Shodan', 'Maltego'],
        color: 'border-blue-500/60', // Use border color for theme
        bgColor: 'bg-blue-900/20', // Subtle background tint
        gradient: 'from-blue-500/30 via-transparent' // For expanded state gradient
      },
      {
        id: 'scan',
        name: 'Scanning & Enumeration',
        icon: ScanLine,
        descriptionPrompt: "Generate a concise description (around 30-40 words) for the Scanning and Enumeration stage of ethical hacking. Explain its goal: actively probing the target for vulnerabilities, open ports, running services, and system details using the information gathered previously. Start directly with the description.",
        tools: ['Nmap (Active)', 'Nessus', 'OpenVAS', 'Nikto', 'Enum4linux'],
        color: 'border-purple-500/60',
        bgColor: 'bg-purple-900/20',
        gradient: 'from-purple-500/30 via-transparent'
      },
      {
        id: 'exploit',
        name: 'Gaining Access',
        icon: KeyRound,
        descriptionPrompt: "Generate a concise description (around 30-40 words) for the Gaining Access (Exploitation) stage of ethical hacking. Describe how vulnerabilities found during scanning are exploited to gain unauthorized access to the target system or network. Mention techniques like exploiting software flaws or weak credentials. Start directly with the description.",
        tools: ['Metasploit', 'Hydra', 'John the Ripper', 'Mimikatz', 'SQLMap'],
        color: 'border-red-500/60',
        bgColor: 'bg-red-900/20',
        gradient: 'from-red-500/30 via-transparent'
      },
];

// Animation variants for card content
const contentVariants = {
    collapsed: { opacity: 0, height: 0, y: 10, transition: { duration: 0.2 } },
    expanded: { opacity: 1, height: 'auto', y: 0, transition: { duration: 0.3, delay: 0.15 } }
};

const toolVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: (i) => ({ // Custom function for stagger delay
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.05, duration: 0.2 }
    })
};


export default function EthicalHackingStages() {
    // Use null for no expansion, or stage.id for the expanded one
    const [expandedStageId, setExpandedStageId] = useState(null);
    const [stageDetails, setStageDetails] = useState({});
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    // --- Fetching Logic (identical to previous versions) ---
    useEffect(() => {
        const fetchAllDescriptions = async () => {
          setIsLoadingInitial(true);
          const initialDetails = {};
          hackingStages.forEach(stage => {
            initialDetails[stage.id] = { description: null, isLoading: true, error: null };
          });
          setStageDetails(initialDetails);

          const fetchPromises = hackingStages.map(async (stage) => {
            try {
              const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [{ role: "user", content: stage.descriptionPrompt }] }),
              });
              if (!res.ok) throw new Error(`AI server error (${res.status})`);
              const data = await res.json();
              return { id: stage.id, description: data.content || `Learn about ${stage.name}.` };
            } catch (error) {
              console.error(`Failed to fetch description for ${stage.name}:`, error);
              return { id: stage.id, error: `Could not load details for ${stage.name}.` };
            }
          });

          const results = await Promise.all(fetchPromises);
          setStageDetails(prevDetails => {
            const newDetails = { ...prevDetails };
            results.forEach(result => {
              newDetails[result.id] = {
                ...newDetails[result.id],
                description: result.description,
                error: result.error,
                isLoading: false,
              };
            });
            return newDetails;
          });
          setIsLoadingInitial(false);
        };
        fetchAllDescriptions();
      }, []);

    const handleCardClick = (id) => {
        // If clicking the already expanded card, collapse it. Otherwise, expand the new one.
        setExpandedStageId(prevId => (prevId === id ? null : id));
    };

    return (
        // --- Main Container ---
        // Use min-height to allow container to grow if needed
        <section className="mb-16 md:mb-20 w-full flex justify-center items-start px-4 md:px-8 relative min-h-[350px]">

           {/* LayoutGroup enables layout animations between siblings */}
           {/* Use a flex container for the cards */}
           <LayoutGroup>
             <motion.div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-5xl">
                {hackingStages.map((stage, index) => {
                    const isExpanded = expandedStageId === stage.id;
                    const details = stageDetails[stage.id] || { isLoading: true };

                    return (
                        <motion.div
                            key={stage.id}
                            layout // Enable layout animation for smooth resizing/repositioning
                            onClick={() => handleCardClick(stage.id)}
                            // --- Card Styling (Collapsed & Expanded handled by layout/animate) ---
                            className={`
                                rounded-xl border ${stage.color} ${stage.bgColor}
                                p-4 md:p-6 cursor-pointer overflow-hidden
                                shadow-lg hover:shadow-xl hover:border-opacity-90 transition-all duration-300
                                relative group
                                ${isExpanded ? 'flex-[3]' : 'flex-[1]'} // Grow expanded card
                            `}
                            initial={{ borderRadius: '12px' }} // Maintain border radius during layout animation
                            transition={{ type: 'spring', stiffness: 150, damping: 20 }} // Spring animation for layout
                        >
                            {/* --- Card Header (Always Visible) --- */}
                            <motion.div layout="position" className="flex items-center gap-3 mb-3">
                                <stage.icon size={isExpanded ? 28 : 24} className={`transition-all ${stage.color.replace('border-', 'text-').split('/')[0]}`} />
                                <h3 className={`font-semibold transition-all ${isExpanded ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}>
                                    {stage.name}
                                </h3>
                                {/* Info icon for collapsed state */}
                                {!isExpanded && <Info size={16} className="ml-auto text-gray-500 group-hover:text-gray-300 transition-colors"/>}
                                {/* Close icon for expanded state */}
                                {isExpanded && (
                                    <motion.button
                                        className="ml-auto text-gray-500 hover:text-white z-10"
                                        onClick={(e) => { e.stopPropagation(); handleCardClick(stage.id); }} // Stop propagation to prevent card click
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        aria-label="Close details"
                                    >
                                        <X size={20} />
                                    </motion.button>
                                )}
                            </motion.div>

                            {/* --- Expanded Content Area --- */}
                            {/* Use AnimatePresence for smooth fade-in/out of details */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        className="overflow-hidden mt-4"
                                        variants={contentVariants}
                                        initial="collapsed"
                                        animate="expanded"
                                        exit="collapsed"
                                    >
                                        {/* AI Description */}
                                        <div className="text-sm md:text-base text-gray-300 leading-relaxed font-mono min-h-[40px] mb-5">
                                            {details.isLoading ? (
                                                <span className="flex items-center gap-2 text-gray-400"><Loader size={16} className="animate-spin"/> Loading description...</span>
                                            ) : details.error ? (
                                                <span className="flex items-center gap-2 text-yellow-400"><AlertTriangle size={16}/> {details.error}</span>
                                            ) : (
                                                <Typewriter text={details.description || ''} speed={25} />
                                            )}
                                        </div>

                                        {/* Tools Section */}
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase text-gray-400 mb-3">Common Tools:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {stage.tools.map((tool, i) => (
                                                    <motion.span
                                                        key={tool}
                                                        custom={i} // Pass index for stagger delay
                                                        variants={toolVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        className={`text-xs md:text-sm bg-gray-700/50 text-gray-200 px-2.5 py-1 rounded-full border border-gray-600/50`}
                                                    >
                                                        {tool}
                                                    </motion.span>
                                                ))}
                                            </div>
                                        </div>
                                         {/* Optional: Add a subtle gradient overlay for visual flair */}
                                        <div className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t ${stage.gradient} opacity-50 rounded-b-xl pointer-events-none`}></div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
             </motion.div>
           </LayoutGroup>

            {/* Loading Indicator for Initial Data Fetch */}
            {isLoadingInitial && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0A2540]/70 backdrop-blur-sm z-30 rounded-lg">
                    <Loader size={30} className="text-[#00ADEE] animate-spin" />
                    <span className="ml-3 text-lg text-gray-300">Loading Hacking Stages...</span>
                </div>
            )}
        </section>
    );
}