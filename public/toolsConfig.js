// config/toolsConfig.js

import { Activity, Globe, Shield, Lock, Search, Database, Target, Code, AlertTriangle } from "lucide-react"; // Added AlertTriangle and Code

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
            // Ensure target is present before adding scan type options
            if (!values.target) return "echo 'Error: Target is required.'";
            return (command + scanTypes[values.scanType]).trim();
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
                  { value: "quick", label: "Quick (-T4 -F)" },
                  { value: "full", label: "Full (-p- -sV -O)" },
                  { value: "udp", label: "UDP (-sU)" },
                  { value: "custom", label: "Custom" },
                ],
              },
              {
                name: "ports",
                type: "text",
                label: "Ports",
                placeholder: "e.g., 80,443,100-200",
                visibleWhen: { field: "scanType", value: "custom" },
              },
              {
                name: "osDetection",
                type: "checkbox",
                label: "OS Detection (-O)",
                visibleWhen: { field: "scanType", value: "custom" },
              },
              {
                name: "serviceVersion",
                type: "checkbox",
                label: "Service Version (-sV)",
                visibleWhen: { field: "scanType", value: "custom" },
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these nmap results:\n{output}\nProvide a summary focusing on open ports, detected services/versions, and potential OS. Highlight any significant security concerns or interesting findings.`,
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
          buildCommand: (values) => {
             if (!values.target) return "echo 'Error: Target is required.'";
             return `traceroute ${values.target}`
          },
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
            prompt: `Analyze these traceroute results:\n{output}\nSummarize the network route, identifying key hops, ASN information if available, and noting any significant latency jumps or timeouts.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },
        // *** NEW TOOL: Ping ***
        ping: {
          id: 7, // Continue numbering
          name: "Ping",
          icon: <Target size={24} />, // Using Target icon
          description: "Check host reachability and round-trip time",
          initialValues: {
            target: "",
            count: 4, // Default ping count
          },
          buildCommand: (values) => {
             if (!values.target) return "echo 'Error: Target is required.'";
             // Assuming Linux/macOS ping, use -c for count. Windows uses -n.
             // Add logic here if multi-OS support is needed.
             return `ping -c ${values.count || 4} ${values.target}`;
          },
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Target",
                placeholder: "Enter hostname or IP",
              },
              {
                name: "count",
                type: "number",
                label: "Count",
                placeholder: "Number of pings (e.g., 4)",
                min: 1, // Optional: add min/max constraints
                max: 100,
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these ping results:\n{output}\nSummarize if the host is reachable, packet loss percentage, and the average round-trip time (RTT).`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },
      },
    }, // End networkAnalysis Group

    webSecurity: {
      name: "Web Security",
      tools: {
        nikto: {
          id: 4,
          name: "Nikto",
          icon: <Lock size={24} />,
          description: "Scan web servers for known vulnerabilities",
          initialValues: {
            target: "",
            port: "80", // Add default port
            tuning: "", // Add option for tuning
          },
          buildCommand: (values) => {
             if (!values.target) return "echo 'Error: Target URL/IP is required.'";
             let command = `nikto -h ${values.target}`;
             if (values.port && values.port !== "80") { // Only add -p if not default
                command += ` -p ${values.port}`;
             }
             if (values.tuning) {
                command += ` -Tuning ${values.tuning}`;
             }
             return command;
          },
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Target URL/IP",
                placeholder: "Enter target host (e.g., example.com or 1.2.3.4)",
              },
              {
                name: "port",
                type: "text",
                label: "Port (optional)",
                placeholder: "Default: 80/443 based on scheme",
              },
              {
                 name: "tuning",
                 type: "select",
                 label: "Tuning (optional)",
                 options: [
                    { value: "", label: "Default (Multiple)" },
                    { value: "0", label: "File Upload" },
                    { value: "1", label: "Interesting File / Seen in logs" },
                    { value: "2", label: "Misconfiguration / Default File" },
                    { value: "3", label: "Information Disclosure" },
                    // ... Add other tuning options 4-9, a-c, x ...
                    { value: "x", label: "Reverse Tuning Options" },
                 ]
              }
            ],
          },
          aiProcessing: {
            prompt: `Analyze these Nikto scan results:\n{output}\nSummarize the findings, focusing on detected vulnerabilities (like outdated software, insecure configurations, specific CVEs mentioned), information disclosure issues, and recommended remediation steps. Prioritize critical findings.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },
        // *** NEW TOOL: Gobuster ***
        gobuster: {
            id: 9, // Continue numbering
            name: "Gobuster (Dir)",
            icon: <Search size={24} />, // Using Search icon
            description: "Discover hidden directories and files on web servers",
            initialValues: {
                targetUrl: "",
                wordlist: "/usr/share/wordlists/dirb/common.txt", // Common default, adjust if needed
                extensions: "", // e.g., php,html,txt
                statusCode: "200,204,301,302,307,401,403", // Default codes
            },
            buildCommand: (values) => {
                if (!values.targetUrl) return "echo 'Error: Target URL is required.'";
                // Basic validation for URL format
                if (!values.targetUrl.startsWith('http://') && !values.targetUrl.startsWith('https://')) {
                    return "echo 'Error: Target URL must start with http:// or https://'";
                }
                let command = `gobuster dir -u ${values.targetUrl} -w ${values.wordlist}`;
                if (values.extensions) {
                    command += ` -x ${values.extensions}`;
                }
                 if (values.statusCode) {
                    command += ` -s ${values.statusCode}`;
                }
                // Add other useful flags like -t for threads, -k to skip SSL verification, etc. if desired
                // command += " -k"; // Example: Skip SSL verification
                // command += " -t 50"; // Example: 50 threads
                return command;
            },
            config: {
                inputs: [
                    {
                        name: "targetUrl",
                        type: "text",
                        label: "Target URL",
                        placeholder: "e.g., http://example.com",
                    },
                    {
                        name: "wordlist",
                        type: "text",
                        label: "Wordlist Path",
                        placeholder: "Path to wordlist file",
                    },
                    {
                        name: "extensions",
                        type: "text",
                        label: "Extensions (comma-sep, optional)",
                        placeholder: "e.g., php,html,txt",
                    },
                    {
                        name: "statusCode",
                        type: "text",
                        label: "Status Codes (comma-sep)",
                        placeholder: "e.g., 200,301,403",
                    },
                ],
            },
            aiProcessing: {
                prompt: `Analyze these Gobuster results:\n{output}\nList the discovered directories and files. Highlight any potentially sensitive or interesting findings (like admin panels, config files, backups, APIs) based on common patterns. Mention the status codes associated with found items.`,
            },
            processResult: (rawOutput, aiOutput) =>
                aiOutput?.trim() ? aiOutput : rawOutput,
            enabled: true, // Set to false if gobuster isn't installed/configured yet
        },
         // *** NEW TOOL: Sqlmap ***
         sqlmap: {
            id: 10, // Continue numbering
            name: "Sqlmap",
            icon: <Database size={24} />, // Using Database icon
            description: "Automated SQL injection detection & exploitation",
            initialValues: {
                targetUrl: "",
                level: 1,
                risk: 1,
                // Add more options like data, cookie, user-agent etc. if needed
            },
            buildCommand: (values) => {
                if (!values.targetUrl) return "echo 'Error: Target URL with parameters is required.'";
                // Basic validation for URL format and parameters
                if (!values.targetUrl.includes('?')) {
                    return "echo 'Error: Target URL should contain parameters (e.g., ?id=1)'";
                }
                // Use --batch for non-interactive mode, essential for automation
                // Add --random-agent for less predictable fingerprinting
                let command = `sqlmap -u "${values.targetUrl}" --batch --random-agent`;
                if (values.level && values.level > 1) {
                    command += ` --level=${values.level}`;
                }
                if (values.risk && values.risk > 1) {
                    command += ` --risk=${values.risk}`;
                }
                // Example of adding more complex options:
                // if (values.data) { command += ` --data="${values.data}"`; }
                // if (values.cookie) { command += ` --cookie="${values.cookie}"`; }
                return command;
            },
            config: {
                inputs: [
                    {
                        name: "targetUrl",
                        type: "text",
                        label: "Target URL (with parameters)",
                        placeholder: "e.g., http://testphp.vulnweb.com/listproducts.php?cat=1",
                    },
                    {
                        name: "level",
                        type: "select",
                        label: "Level (Depth)",
                        options: [
                            { value: 1, label: "1 (Default)" },
                            { value: 2, label: "2" },
                            { value: 3, label: "3" },
                            { value: 4, label: "4" },
                            { value: 5, label: "5 (Max)" },
                        ],
                    },
                     {
                        name: "risk",
                        type: "select",
                        label: "Risk (Potential Damage)",
                        options: [
                            { value: 1, label: "1 (Default)" },
                            { value: 2, label: "2" },
                            { value: 3, label: "3 (Max)" },
                        ],
                    },
                    // Add inputs for data, cookie, user-agent etc. if you want them configurable
                ],
            },
            aiProcessing: {
                prompt: `Analyze these sqlmap results:\n{output}\nSummarize the findings. Specifically state if SQL injection vulnerabilities were identified, mention the vulnerable parameter(s), the type(s) of SQL injection found (e.g., boolean-based blind, time-based blind, error-based, UNION query), and the identified backend database management system (DBMS). Caution about the potential impact.`,
            },
            processResult: (rawOutput, aiOutput) =>
                aiOutput?.trim() ? aiOutput : rawOutput,
            enabled: true, // Set to false if sqlmap isn't installed/configured yet
        },
      },
    }, // End webSecurity Group

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
          buildCommand: (values) => {
             if (!values.target) return "echo 'Error: Domain/IP is required.'";
             return `whois ${values.target}`;
          },
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
            prompt: `Analyze these WHOIS results:\n{output}\nSummarize key information such as Registrar, Registrant details (if available), creation date, expiration date, update date, and Name Servers. Note any privacy protection services used.`,
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
            source: "google,bing", // Combine sources
            limit: 500, // Add limit option
          },
          buildCommand: (values) => {
             if (!values.target) return "echo 'Error: Domain is required.'";
             // theHarvester might need API keys for some sources, handle that separately if needed.
             return `theHarvester -d ${values.target} -b ${values.source || 'google,bing'} -l ${values.limit || 500}`;
          },
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Domain",
                placeholder: "Enter target domain (e.g., example.com)",
              },
              {
                name: "source",
                type: "text", // Changed to text for multiple sources
                label: "Data Sources (comma-sep)",
                 placeholder: "e.g., google,bing,linkedin",
                 // You could use a multi-select component if your UI framework supports it
              },
              {
                 name: "limit",
                 type: "number",
                 label: "Result Limit per Source",
                 placeholder: "e.g., 500",
              }
            ],
          },
          aiProcessing: {
            prompt: `Analyze these theHarvester results:\n{output}\nSummarize the findings. List the discovered email addresses, hosts/subdomains, and any associated IP addresses found. Mention the sources from which information was gathered.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },
        // *** NEW TOOL: Dig ***
        dig: {
            id: 8, // Continue numbering
            name: "DNS Lookup (dig)",
            icon: <Globe size={24} />,
            description: "Perform DNS lookups for various record types",
            initialValues: {
                target: "",
                recordType: "A", // Default to A record
                dnsServer: "", // Optional specific DNS server
            },
            buildCommand: (values) => {
                if (!values.target) return "echo 'Error: Domain is required.'";
                let command = `dig`;
                 if (values.dnsServer) {
                    // Basic validation for DNS server format (IP or hostname)
                    command += ` @${values.dnsServer}`;
                }
                command += ` ${values.target} ${values.recordType || 'A'}`;
                // Add +short for brief output, or other dig options if needed
                // command += " +short";
                return command;
            },
            config: {
                inputs: [
                    {
                        name: "target",
                        type: "text",
                        label: "Domain",
                        placeholder: "Enter domain name (e.g., google.com)",
                    },
                    {
                        name: "recordType",
                        type: "select",
                        label: "Record Type",
                        options: [
                            { value: "A", label: "A (IPv4 Address)" },
                            { value: "AAAA", label: "AAAA (IPv6 Address)" },
                            { value: "MX", label: "MX (Mail Exchanger)" },
                            { value: "TXT", label: "TXT (Text Records)" },
                            { value: "NS", label: "NS (Name Server)" },
                            { value: "CNAME", label: "CNAME (Canonical Name)" },
                            { value: "SOA", label: "SOA (Start of Authority)" },
                            { value: "PTR", label: "PTR (Pointer - for Reverse DNS)" },
                            { value: "ANY", label: "ANY (All Records)" },
                        ],
                    },
                     {
                        name: "dnsServer",
                        type: "text",
                        label: "DNS Server (optional)",
                        placeholder: "e.g., 8.8.8.8 or ns1.example.com",
                    },
                ],
            },
            aiProcessing: {
                prompt: `Analyze these dig results for {values.target} ({values.recordType}):\n{output}\nSummarize the key information found in the ANSWER SECTION. For A/AAAA, list IPs. For MX, list mail servers and priorities. For TXT, list text strings (mention SPF/DKIM if present). For NS, list name servers. For CNAME, show the alias target. For SOA, note the primary NS and admin email. If the query failed or returned no records, state that.`,
            },
            processResult: (rawOutput, aiOutput) =>
                aiOutput?.trim() ? aiOutput : rawOutput,
            enabled: true,
        },
      },
    }, // End infoGathering Group

    phishingTools: {
      name: "Phishing Tools",
      tools: {
        maxPhisher: {
          id: 11,
          name: "MaxPhisher",
          icon: <AlertTriangle size={24} />,
          description: "Advanced phishing toolkit for educational use", // Short description for grid/tooltip
          isInfoOnly: true, // *** Key Flag ***
          info: { // *** Detailed info for the card ***
            description: "MaxPhisher is a comprehensive phishing toolkit designed to create and manage sophisticated phishing campaigns for ethical hacking and security awareness training. Use cases include security awareness training, authorized penetration testing, and educational demonstrations.",
            usage: "To use MaxPhisher (ensure you have authorization):\n1. Open your terminal.\n2. Run the command: `maxphisher`\n3. Follow the interactive menu to select templates.\n4. Configure attack settings and deployment options.\n\n**WARNING:** For educational and authorized testing purposes ONLY. Unauthorized use is illegal and unethical.",
            risk: "High",
            tags: ["Phishing", "Social Engineering", "Credential Harvesting", "Security Training"],
          },
          enabled: true, // Still controlled by vmStatus
        },
        zphisher: {
          id: 12,
          name: "Zphisher",
          icon: <AlertTriangle size={24} />,
          description: "Automated phishing tool with multiple templates",
          isInfoOnly: true, // *** Key Flag ***
          info: { // *** Detailed info for the card ***
            description: "Zphisher is an automated phishing tool with a wide variety of pre-built website templates, streamlining the creation of convincing phishing pages for security testing. Use cases include security training, demonstrating social engineering, testing policies, and authorized penetration tests.",
            usage: "To use Zphisher (ensure you have authorization):\n1. Open your terminal.\n2. Run the command: `zphisher`\n3. Select a website template from the menu.\n4. Choose a hosting/tunneling method (e.g., localhost, Ngrok).\n5. Share the generated link ONLY in authorized test environments.\n6. Monitor the terminal for captured credentials (if any).\n\n**WARNING:** This tool must ONLY be used in legal contexts like security assessments with explicit authorization. Unauthorized phishing is illegal.",
            risk: "High",
            tags: ["Phishing", "Automated", "Templates", "Social Engineering", "Credential Harvesting"],
          },
          enabled: true, // Still controlled by vmStatus
        },
        // Add other phishing tools here following the same pattern
      }
    }, // End phishingTools Group
    dosTools: {
      name: "DoS Tools",
      tools: {
          slowloris: {
              id: 13, // Next available ID
              name: "Slowloris",
              description: "Low-bandwidth DoS attack tool for testing", // Short description
              isInfoOnly: true, // *** Key Flag ***
              info: { // *** Detailed info for the card ***
                  description: "Slowloris is a type of denial-of-service (DoS) attack tool that requires minimal bandwidth. It works by opening multiple connections to a target web server and keeping them open as long as possible by sending partial HTTP requests, eventually exhausting the server's connection pool. It is effective against servers that handle connections inefficiently. Intended use cases include understanding application-layer DoS vulnerabilities and authorized server stress testing.",
                  usage: "To use Slowloris (ensure you have authorization):\n1. Open your terminal.\n2. Run the command, typically like:\n   `slowloris <target_ip> -p <port> [options]`\n   (Replace `<target_ip>` and `<port>` (e.g., 80)). eg (slowloris 175.176.187.102 -s 200000 --sleeptime 1) \n4. Observe the target's responsiveness (only on authorized targets).\n\n**WARNING:** Using Slowloris against targets without explicit prior authorization is illegal and unethical. This information is for educational and authorized testing purposes ONLY.",
                  risk: "High",
                  tags: ["DoS", "Application Layer", "Slow HTTP", "Web Server", "Stress Test"]
              },
              enabled: true, // Still controlled by vmStatus
          },
          // Add other DoS tools here following the same pattern (e.g., Hulk, GoldenEye)
      }
  }, // End groups
  
}

};