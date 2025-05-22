export const tools = [
    {
        id: 'nmap',
        name: 'Nmap',
        icon: '🔍',
        description: 'Network mapper for security scanning and port discovery',
        formFields: [
            { name: 'target', label: 'Target IP/Host', type: 'text', required: true },
            { name: 'scanType', label: 'Scan Type', type: 'select', options: ['-sS', '-sT', '-sU', '-sV'], required: true }
        ]
    },
    {
        id: 'metasploit',
        name: 'Metasploit',
        icon: '💉',
        description: 'Penetration testing framework for developing and executing exploit code',
        formFields: [
            { name: 'module', label: 'Module', type: 'text', required: true },
            { name: 'payload', label: 'Payload', type: 'select', options: ['windows/meterpreter/reverse_tcp', 'linux/x86/meterpreter/reverse_tcp'], required: true }
        ]
    },
    {
        id: 'wireshark',
        name: 'Wireshark',
        icon: '📡',
        description: 'Network protocol analyzer for capturing and analyzing network traffic',
        formFields: [
            { name: 'interface', label: 'Network Interface', type: 'text', required: true },
            { name: 'filter', label: 'Capture Filter', type: 'text', required: false }
        ]
    }
]; 