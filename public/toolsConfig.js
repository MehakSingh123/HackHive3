// config/toolsConfig.js
import { Activity, Globe, Shield, Lock } from "lucide-react";

export const toolsConfig = {
  groups: {
    networkAnalysis: {
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
                label: "Target",
                placeholder: "Enter IP/CIDR (e.g., 192.168.1.0/24)",
              },
              {
                name: "scanType",
                type: "select",
                label: "Scan Type",
                options: [
                  { value: "quick", label: "Quick" },
                  { value: "full", label: "Full" },
                  { value: "udp", label: "UDP" },
                  { value: "custom", label: "Custom" },
                ],
              },
              {
                name: "ports",
                type: "text",
                label: "Ports",
                placeholder: "e.g., 80,443",
                visibleWhen: { field: "scanType", value: "custom" },
              },
              {
                name: "osDetection",
                type: "checkbox",
                label: "OS Detection",
                visibleWhen: { field: "scanType", value: "custom" },
              },
              {
                name: "serviceVersion",
                type: "checkbox",
                label: "Service Version",
                visibleWhen: { field: "scanType", value: "custom" },
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these nmap results:\n{output}\nProvide a summary and highlight any potential issues.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },

        traceroute: {
          id: 2,
          name: "Traceroute",
          icon: <Globe size={24} />,
          description: "Trace the network path to a host",
          initialValues: {
            target: "",
          },
          buildCommand: (values) => `traceroute ${values.target}`,
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Target",
                placeholder: "Enter hostname or IP",
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these traceroute results:\n{output}\nSummarize the network route and latency details.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },
      },
    },

    webSecurity: {
      name: "Web Security",
      tools: {
        nikto: {
          id: 4,
          name: "Nikto",
          icon: <Lock size={24} />,
          description: "Scan web servers for vulnerabilities",
          initialValues: {
            target: "",
          },
          buildCommand: (values) => `nikto -h ${values.target}`,
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Target URL/IP",
                placeholder: "Enter target URL or IP",
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these Nikto scan results:\n{output}\nHighlight key vulnerabilities and recommendations.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },
      },
    },

    infoGathering: {
      name: "Info Gathering",
      tools: {
        whoisLookup: {
          id: 5,
          name: "Whois Lookup",
          icon: <Globe size={24} />,
          description: "Retrieve domain registration information",
          initialValues: {
            target: "",
          },
          buildCommand: (values) => `whois ${values.target}`,
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Domain/IP",
                placeholder: "Enter domain or IP",
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these WHOIS results:\n{output}\nSummarize registration details and important dates.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },

        theHarvester: {
          id: 6,
          name: "theHarvester",
          icon: <Activity size={24} />,
          description: "Gather emails and subdomains from public sources",
          initialValues: {
            target: "",
            source: "google",
          },
          buildCommand: (values) =>
            `theHarvester -d ${values.target} -b ${values.source}`,
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Domain",
                placeholder: "Enter target domain",
              },
              {
                name: "source",
                type: "select",
                label: "Data Source",
                options: [
                  { value: "google", label: "Google" },
                  { value: "bing", label: "Bing" },
                  { value: "baidu", label: "Baidu" },
                ],
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these theHarvester results:\n{output}\nSummarize the collected emails and subdomains.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },
      },
    },
  },
};
