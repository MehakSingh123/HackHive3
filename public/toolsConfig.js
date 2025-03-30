// config/toolsConfig.js
import { Activity, Globe, Shield, Lock } from "lucide-react";

export const toolsConfig = {
  groups: {
    network: {
      name: "Network Analysis",
      tools: {
        nmap: {
          id: 1,
          name: "Network Mapper",
          icon: <Activity size={24} />,
          description: "Scan networks and discover hosts and services",
          initialValues: {
            target: "",
            scanType: "quick",
            ports: "",
            osDetection: false,
            serviceVersion: true,
          },
          buildCommand: (values) => {
            let command = `nmap ${values.target} `;
            const scanTypes = {
              quick: "-T4 -F",
              full: "-p- -sV -O",
              udp: "-sU",
              custom: `${values.ports ? `-p ${values.ports}` : ""} ` +
                      `${values.osDetection ? "-O " : ""}` +
                      `${values.serviceVersion ? "-sV " : ""}`,
            };
            return command + scanTypes[values.scanType];
          },
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Target Configuration",
                placeholder: "Enter IP/CIDR (e.g., 192.168.1.0/24)",
              },
              {
                name: "scanType",
                type: "select",
                label: "Scan Profile",
                options: [
                  { value: "quick", label: "🚀 Quick Scan" },
                  { value: "full", label: "🔍 Full Comprehensive Scan" },
                  { value: "udp", label: "🛡️ UDP Port Scan" },
                  { value: "custom", label: "⚙️ Custom Configuration" },
                ],
              },
              {
                name: "ports",
                type: "text",
                label: "Port Specification",
                placeholder: "Example: 80,443,1000-2000,U:53",
                visibleWhen: { field: "scanType", value: "custom" },
              },
              {
                name: "osDetection",
                type: "checkbox",
                label: "🖥️ OS Fingerprinting Detection",
                visibleWhen: { field: "scanType", value: "custom" },
              },
              {
                name: "serviceVersion",
                type: "checkbox",
                label: "🔍 Service Version Detection",
                visibleWhen: { field: "scanType", value: "custom" },
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these nmap results:\n{output}\nFormat as markdown with: Summary, Open Ports table, Vulnerabilities (CVSS >7), and Recommendations.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },

        ping: {
          id: 2,
          name: "Ping",
          icon: <Globe size={24} />,
          description: "Check the reachability of a host",
          initialValues: {
            target: "",
            count: "4",
          },
          buildCommand: (values) => {
            let command = `ping ${values.target} `;
            if (values.count) command += `-c ${values.count}`;
            return command;
          },
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Target Host",
                placeholder: "Enter IP or hostname",
              },
              {
                name: "count",
                type: "text",
                label: "Packet Count",
                placeholder: "Number of packets to send (default 4)",
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these ping results:\n{output}\nProvide a summary and any suggestions for troubleshooting connectivity issues in markdown format.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },
      },
    },

    security: {
      name: "Security & Exploitation",
      tools: {
        vulnerabilityScanner: {
          id: 3,
          name: "Vulnerability Scanner",
          icon: <Shield size={24} />,
          description: "Identify security vulnerabilities in systems",
          // Added a config so it opens as an expanded form
          initialValues: {
            target: "",
          },
          buildCommand: (values) => {
            // Replace with your actual vulnerability scan command
            return `vulnscan --target ${values.target}`;
          },
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Target System",
                placeholder: "Enter target IP or URL",
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these vulnerability scan results:\n{output}\nSummarize findings and suggest fixes.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },

        passwordCracker: {
          id: 4,
          name: "Password Cracker",
          icon: <Lock size={24} />,
          description: "Test password strength and security",
          initialValues: {
            hash: "",
            wordlist: "",
          },
          buildCommand: (values) =>
            `hashcat -m 0 -a 0 ${values.hash} ${values.wordlist}`,
          config: {
            inputs: [
              {
                name: "hash",
                type: "text",
                label: "Hash",
                placeholder: "Enter hash to crack",
              },
              {
                name: "wordlist",
                type: "text",
                label: "Wordlist Path",
                placeholder: "Enter path to wordlist",
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these password cracking results:\n{output}\nExplain cracked passwords, patterns, and security recommendations.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },
      },
    },
  },
};
