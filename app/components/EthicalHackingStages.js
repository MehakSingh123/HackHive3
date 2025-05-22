// app/components/EthicalHackingStages.js
"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ScanLine, KeyRound, X } from 'lucide-react';

const hackingStages = [
    {
        id: 'recon',
        name: 'Reconnaissance',
        icon: Eye,
        description: "The initial phase of ethical hacking where information about the target system is gathered through passive and active methods. This includes footprinting, OSINT, and network scanning to identify potential entry points and vulnerabilities.",
        tools: ['Nmap', 'OSINT', 'theHarvester', 'Shodan', 'Maltego'],
        color: 'border-blue-500/20',
        bgColor: 'bg-blue-900/10',
    },
    {
        id: 'scan',
        name: 'Scanning & Enumeration',
        icon: ScanLine,
        description: "Active probing of the target system to identify open ports, running services, and potential vulnerabilities. This stage involves detailed analysis of network services, system configurations, and security weaknesses.",
        tools: ['Nmap (Active)', 'Nessus', 'OpenVAS', 'Nikto', 'Enum4linux'],
        color: 'border-purple-500/20',
        bgColor: 'bg-purple-900/10',
    },
    {
        id: 'exploit',
        name: 'Gaining Access',
        icon: KeyRound,
        description: "The phase where identified vulnerabilities are exploited to gain unauthorized access to the target system. This involves using various techniques and tools to bypass security measures and establish a foothold.",
        tools: ['Metasploit', 'Hydra', 'John the Ripper', 'Mimikatz', 'SQLMap'],
        color: 'border-red-500/20',
        bgColor: 'bg-red-900/10',
    },
];

const contentVariants = {
    collapsed: { opacity: 0, height: 0 },
    expanded: { opacity: 1, height: 'auto' }
};

export default function EthicalHackingStages() {
    const [expandedStageId, setExpandedStageId] = useState(null);

    const handleCardClick = (id) => {
        setExpandedStageId(prevId => (prevId === id ? null : id));
    };

    return (
        <section className="py-12">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {hackingStages.map((stage) => {
                        const isExpanded = expandedStageId === stage.id;

                        return (
                            <motion.div
                                key={stage.id}
                                layout
                                onClick={() => handleCardClick(stage.id)}
                                className={`
                                    rounded-xl border ${stage.color} ${stage.bgColor}
                                    p-6 cursor-pointer overflow-hidden
                                    transition-all duration-200
                                    hover:shadow-lg hover:border-opacity-40
                                    flex flex-col
                                    ${isExpanded ? 'h-auto' : 'h-[100px]'}
                                `}
                            >
                                <div className={`flex items-center ${!isExpanded ? 'justify-center h-full' : 'justify-between'}`}>
                                    <div className="flex items-center gap-3">
                                        <stage.icon size={24} className={`${stage.color.replace('border-', 'text-').split('/')[0]}`} />
                                        <h3 className="text-lg font-medium text-gray-100">
                                            {stage.name}
                                        </h3>
                                    </div>
                                    {isExpanded && (
                                        <button
                                            className="text-gray-400 hover:text-white transition-colors"
                                            onClick={(e) => { e.stopPropagation(); handleCardClick(stage.id); }}
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial="collapsed"
                                            animate="expanded"
                                            exit="collapsed"
                                            variants={contentVariants}
                                            className="mt-6 flex-1 flex flex-col justify-center"
                                        >
                                            <div className="text-sm text-gray-300 leading-relaxed mb-6 text-center">
                                                <p className="text-gray-300">{stage.description}</p>
                                            </div>

                                            <div className="space-y-3">
                                                <h4 className="text-xs font-medium text-gray-400 text-center">Common Tools</h4>
                                                <div className="flex flex-wrap gap-2 justify-center">
                                                    {stage.tools.map((tool) => (
                                                        <span
                                                            key={tool}
                                                            className="text-xs bg-gray-800/50 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700/50"
                                                        >
                                                            {tool}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}