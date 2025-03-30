// components/OsintTools.js
"use client";
import { useState, useContext, useEffect } from "react";
import { Search, User, MapPin, Globe, Mail, Phone, Hash, AlertTriangle, Camera, Trash2, Download, RefreshCw, Linkedin, Twitter, Github, Facebook, Instagram } from "lucide-react";
import { TerminalContext } from "../contexts/TerminalContext";
import { CommandProcessorContext } from "../contexts/CommandProcessorContext";
import { useAIChat } from "../contexts/AIChatContext";

export default function OsintTools() {
  const { addTerminalOutput, setTerminalVisible } = useContext(TerminalContext);
  const { processCommand } = useContext(CommandProcessorContext);
  const { setChatVisible, addMessage } = useAIChat();
  
  const [searchParams, setSearchParams] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    location: "",
    company: "", 
    social: "",
    additionalInfo: "",
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("search");
  const [selectedTools, setSelectedTools] = useState({
    sherlock: true,
    theHarvester: true,
    whois: true,
    geoIP: true,
    socialAnalyzer: true,
    imageSearch: false,
    googleDorks: true,
  });
  
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStage, setSearchStage] = useState("");
  const [foundProfiles, setFoundProfiles] = useState([]);
  const [searchSummary, setSearchSummary] = useState(null);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };
  
  const handleToolToggle = (tool) => {
    setSelectedTools(prev => ({ ...prev, [tool]: !prev[tool] }));
  };
  
  const clearResults = () => {
    setResults(null);
    setFoundProfiles([]);
    setSearchSummary(null);
    addTerminalOutput("system", "OSINT results cleared");
  };
  
  // Function to generate Google Dork queries based on the target information
  const generateGoogleDorks = (params) => {
    const dorks = [];
    
    if (params.fullName) {
      dorks.push(`"${params.fullName}" filetype:pdf OR filetype:doc OR filetype:docx`);
      dorks.push(`"${params.fullName}" site:linkedin.com`);
      dorks.push(`"${params.fullName}" intext:resume OR cv OR "curriculum vitae"`);
    }
    
    if (params.username) {
      dorks.push(`"${params.username}" forum OR blog OR comment`);
      dorks.push(`"${params.username}" site:github.com OR site:gitlab.com`);
    }
    
    if (params.email) {
      dorks.push(`"${params.email}" -inurl:(htm|html|php|pls|txt) intitle:index.of "last modified"`);
      const domain = params.email.split('@')[1];
      if (domain) dorks.push(`site:${domain} intext:"staff" OR "team" OR "employees" OR "directory"`);
    }
    
    if (params.company) {
      dorks.push(`site:linkedin.com employees "${params.company}"`);
      dorks.push(`"${params.company}" filetype:xls OR filetype:xlsx OR filetype:csv`);
    }
    
    if (params.location && params.fullName) {
      dorks.push(`"${params.fullName}" "${params.location}" site:facebook.com OR site:instagram.com`);
    }
    
    return dorks;
  };
  
  const simulateToolOutput = async (tool, params) => {
    // In a real implementation, this would call actual tools
    // For now, we'll simulate responses for demonstration
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    
    switch(tool) {
      case "sherlock":
        if (!params.username) return "No username provided for search";
        return `[*] Checking username ${params.username} on 187 sites
[+] Instagram: https://instagram.com/${params.username}
[+] Twitter: https://twitter.com/${params.username}
[+] GitHub: https://github.com/${params.username}
[+] Reddit: https://www.reddit.com/user/${params.username}
[+] Medium: https://medium.com/@${params.username}
[+] Flickr: https://www.flickr.com/people/${params.username}
[+] LinkedIn: https://www.linkedin.com/in/${params.username}
[+] Pinterest: https://www.pinterest.com/${params.username}
[*] Search completed with 8 results`;
      
      case "theHarvester":
        const domain = params.email?.split('@')[1] || params.company || "unknown";
        return `*******************************************************************
*  _   _                                            _             *
* | |_| |__   ___    /\\  /\\__ _ _ ____   _____  ___| |_ ___ _ __  *
* | __| '_ \\ / _ \\  / /_/ / _\` | '__\\ \\ / / _ \\/ __| __/ _ \\ '__| *
* | |_| | | |  __/ / __  / (_| | |   \\ V /  __/\\__ \\ ||  __/ |    *
*  \\__|_| |_|\\___| \\/ /_/ \\__,_|_|    \\_/ \\___||___/\\__\\___|_|    *
*                                                                 *
* theHarvester 4.2.0                                              *
*******************************************************************

[*] Target: ${domain}
[*] Searching Google for host names and emails
[*] Searching social networks
 
[*] Emails found:
info@${domain}
support@${domain}
${params.fullName ? params.fullName.toLowerCase().replace(' ', '.') + '@' + domain : 'contact@' + domain}
hr@${domain}

[*] Hosts found:
www.${domain}
mail.${domain}
support.${domain}
blog.${domain}`;
      
      case "whois":
        if (!params.company) return "No company/domain provided";
        const lookupDomain = params.company.includes('.') ? params.company : `${params.company}.com`;
        return `Domain Name: ${lookupDomain}
Registry Domain ID: 2336553_DOMAIN_COM-VRSN
Registrar WHOIS Server: whois.registrar.com
Registrar URL: http://www.registrar.com
Updated Date: 2023-04-23T09:23:42Z
Creation Date: 2005-08-17T19:18:17Z
Registrar Registration Expiration Date: 2025-08-17T19:18:17Z
Registrar: Example Registrar, LLC
Registrar IANA ID: 1234
Registrar Abuse Contact Email: abuse@registrar.com
Registrar Abuse Contact Phone: +1.5555551234
Domain Status: clientTransferProhibited
Registry Registrant ID: 
Registrant Name: Domain Administrator
Registrant Organization: ${params.company}
Registrant Street: 123 Example Street
Registrant City: San Francisco
Registrant State/Province: CA
Registrant Postal Code: 94105
Registrant Country: US
Registrant Phone: +1.5555551234
Registrant Email: domains@${lookupDomain.toLowerCase()}
Name Server: NS1.EXAMPLE-DNS.COM
Name Server: NS2.EXAMPLE-DNS.COM
DNSSEC: unsigned`;
      
      case "geoIP":
        if (!params.location) return "No IP/location provided";
        // Check if input looks like an IP address
        const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(params.location);
        const locationData = isIP ? {
          ip: params.location,
          city: "San Francisco",
          region: "California",
          country: "US",
          loc: "37.7749,-122.4194",
          org: "AS13335 Cloudflare, Inc.",
          postal: "94107",
          timezone: "America/Los_Angeles"
        } : {
          ip: "8.8.8.8", // Google DNS as placeholder
          city: params.location,
          region: "California",
          country: "US",
          loc: "37.7749,-122.4194",
          org: "AS15169 Google LLC",
          postal: "94107",
          timezone: "America/Los_Angeles"
        };
        
        return JSON.stringify(locationData, null, 2);
      
      case "socialAnalyzer":
        if (!params.username && !params.fullName) return "No username or name provided";
        const name = params.username || params.fullName.toLowerCase().replace(' ', '');
        
        const fakeSocialData = [
          { platform: "Instagram", url: `https://instagram.com/${name}`, exists: Math.random() > 0.3 },
          { platform: "Twitter", url: `https://twitter.com/${name}`, exists: Math.random() > 0.3 },
          { platform: "Facebook", url: `https://facebook.com/${name}`, exists: Math.random() > 0.4 },
          { platform: "LinkedIn", url: `https://linkedin.com/in/${name}`, exists: Math.random() > 0.3 },
          { platform: "GitHub", url: `https://github.com/${name}`, exists: Math.random() > 0.5 },
          { platform: "Pinterest", url: `https://pinterest.com/${name}`, exists: Math.random() > 0.6 },
          { platform: "Medium", url: `https://medium.com/@${name}`, exists: Math.random() > 0.7 },
          { platform: "Reddit", url: `https://reddit.com/user/${name}`, exists: Math.random() > 0.6 },
        ];
        
        // Filter to only show "existing" profiles
        const existingProfiles = fakeSocialData.filter(profile => profile.exists);
        
        // Add these to the foundProfiles state
        setFoundProfiles(prev => [...prev, ...existingProfiles]);
        
        return `[+] Checking username "${name}" on 100 social networks
${existingProfiles.map(p => `[+] Found account: ${p.platform} - ${p.url}`).join('\n')}
[*] Search completed. Found ${existingProfiles.length} accounts`;
      
      case "googleDorks":
        const dorks = generateGoogleDorks(params);
        if (dorks.length === 0) return "Insufficient information to generate dork queries";
        
        return `[*] Generated ${dorks.length} Google Dork queries for target
${dorks.map((dork, i) => `[${i+1}] ${dork}`).join('\n')}

[*] Executing search for most relevant dork query...
[+] Found 15+ results for primary query
[+] Top results extracted for analysis`;
      
      case "imageSearch":
        return `[*] Searching for images of target
[+] Found 8 potential matches using reverse image search
[+] Associated metadata extracted for analysis`;
        
      default:
        return "Tool not recognized or implemented";
    }
  };
  
  const runSearchTools = async () => {
    setIsSearching(true);
    setSearchProgress(0);
    setSearchStage("Initializing OSINT investigation...");
    setResults(null);
    setFoundProfiles([]);
    setSearchSummary(null);
    
    addTerminalOutput("system", "OSINT investigation initiated...");
    setTerminalVisible(true);
    
    let commands = [];
    let results = {};
    const totalTools = Object.values(selectedTools).filter(Boolean).length;
    let completedTools = 0;
    
    // First, ask AI to prepare the investigation strategy
    try {
      setSearchStage("Generating AI-guided investigation strategy...");
      setSearchProgress(5);
      
      // Format the input parameters for AI guidance
      const paramStr = Object.entries(searchParams)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      
      const aiPlanPrompt = `You are an OSINT expert tasked with creating an investigation strategy for a target.
Available information:
${paramStr}

Design a comprehensive OSINT investigation strategy that will:
1. Prioritize which data points to investigate first
2. Recommend specific tools for each data point
3. Suggest potential correlations between different pieces of information
4. Identify high-value targets for deeper investigation

Format your response as a concise, actionable investigation plan.`;
      
      // Here we'd call the AI service in a real implementation
      // For demo, we'll simulate a response delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      addTerminalOutput("system", "AI-guided strategy generated. Beginning tool execution...");
      
      // Now run each selected tool
      for (const [tool, selected] of Object.entries(selectedTools)) {
        if (selected) {
          setSearchStage(`Running ${tool}...`);
          setSearchProgress(5 + ((completedTools / totalTools) * 60));
          
          const command = `${tool} ${searchParams.username || searchParams.fullName || searchParams.email || ""}`;
          addTerminalOutput("command", `root@vm:~# ${command}`);
          
          try {
            // In a real implementation, you'd call an API endpoint
            // that would execute the actual tool
            const output = await simulateToolOutput(tool, searchParams);
            results[tool] = output;
            commands.push({ tool, command, output });
            addTerminalOutput("output", output);
          } catch (error) {
            addTerminalOutput("error", `Error running ${tool}: ${error.message}`);
          }
          
          completedTools++;
        }
      }
      
      // Now that all tools have run, send the compiled results to AI for analysis
      if (commands.length > 0) {
        setSearchStage("Analyzing collected intelligence data...");
        setSearchProgress(70);
        
        const aiPrompt = `You are an expert OSINT analyst reviewing data collected on a target. 
Analyze these OSINT results from multiple tools and create a comprehensive intelligence profile:

${commands.map(c => `## ${c.tool} Results\n\`\`\`\n${c.output}\n\`\`\``).join('\n\n')}

Based on the provided OSINT data:

1. Create a complete profile of the target with all discovered information
2. Identify the target's digital footprint across platforms
3. Evaluate potential security risks or vulnerabilities
4. Suggest areas for further investigation
5. Highlight any inconsistencies or red flags in the data

Format your analysis as a professional intelligence report with clear sections.`;
        
        // Here we'd call the AI service in a real implementation
        // For demo, simulate a response
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const fakeAIResponse = `# OSINT Intelligence Report

## Subject Profile
- **Name**: ${searchParams.fullName || "Unknown"}
- **Username(s)**: ${searchParams.username || "Unknown"} (consistent across multiple platforms)
- **Email**: ${searchParams.email || "Unknown"}
- **Location**: ${searchParams.location || "Unknown"}
- **Organization**: ${searchParams.company || "Unknown"}
- **Phone**: ${searchParams.phone || "Unknown"}

## Digital Footprint
- **Social Media Presence**: Identified active accounts on Instagram, Twitter, GitHub, and LinkedIn
- **Professional Presence**: Active on professional networks, with technical background suggested by GitHub activity
- **Content Creation**: Some publishing activity on Medium
- **Geographic Indicators**: Primary location consistent with provided information

## Security Assessment
- **Exposure Level**: Moderate
- **PII Availability**: Email address and username widely exposed
- **Password Reuse Risk**: High (same username across multiple platforms)
- **Doxing Risk**: Medium (personal information spread across various platforms)

## Recommendations
1. **Further Investigation Areas**:
   - Examine GitHub repositories for potentially sensitive information
   - Review historical social media content using archive services
   - Search for data breach inclusions with identified email

2. **Risk Mitigation**:
   - Review privacy settings across identified platforms
   - Consider username diversification across critical services
   - Audit publicly accessible professional information

## Data Reliability
Overall confidence in this profile is **MEDIUM-HIGH**. Multiple independent sources corroborate key information.

## Attachments
- 8 social media profiles identified
- 4 email addresses associated with target
- 2 potential physical locations`;

        setSearchSummary(fakeAIResponse);
        setSearchProgress(100);
        setSearchStage("Intelligence profile complete");
        
        setChatVisible(true);
        addMessage(aiPrompt);
      }

      setResults(results);
    } catch (error) {
      addTerminalOutput("error", `OSINT search failed: ${error.message}`);
      setSearchProgress(100);
      setSearchStage("Investigation failed");
    } finally {
      setIsSearching(false);
    }
  };
  
  const getSocialIcon = (platform) => {
    switch(platform.toLowerCase()) {
      case 'linkedin': return <Linkedin size={18} />;
      case 'twitter': return <Twitter size={18} />;
      case 'github': return <Github size={18} />;
      case 'facebook': return <Facebook size={18} />;
      case 'instagram': return <Instagram size={18} />;
      default: return <Globe size={18} />;
    }
  };
  
  const downloadReport = () => {
    if (!searchSummary) return;
    
    const blob = new Blob([searchSummary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint-report-${searchParams.fullName || searchParams.username || 'target'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl border-2 border-blue-500 overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-blue-700 bg-gray-900">
        <h3 className="text-xl font-bold flex items-center gap-3">
          <Search size={24} className="text-blue-400" />
          AI-Enhanced OSINT Investigation
        </h3>
        <div className="flex">
          <button onClick={() => setActiveTab("search")} className={`px-4 py-2 rounded-l-lg ${activeTab === "search" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}>
            Search
          </button>
          <button onClick={() => setActiveTab("results")} className={`px-4 py-2 ${activeTab === "results" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}>
            Results
          </button>
          <button onClick={() => setActiveTab("tools")} className={`px-4 py-2 rounded-r-lg ${activeTab === "tools" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}>
            Tools
          </button>
        </div>
      </div>
      
      <div className="p-6 h-full overflow-y-auto">
        {activeTab === "search" ? (
          <div className="space-y-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-300 text-sm">Enter whatever information you have about the target. Our AI will develop an optimal OSINT investigation strategy and execute it using multiple intelligence gathering tools.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={searchParams.fullName}
                    onChange={handleInputChange}
                    className="pl-10 w-full bg-gray-700 rounded-lg px-4 py-2 text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                <div className="relative">
                  <Hash size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={searchParams.username}
                    onChange={handleInputChange}
                    className="pl-10 w-full bg-gray-700 rounded-lg px-4 py-2 text-sm"
                    placeholder="johndoe123"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="email"
                    value={searchParams.email}
                    onChange={handleInputChange}
                    className="pl-10 w-full bg-gray-700 rounded-lg px-4 py-2 text-sm"
                    placeholder="john.doe@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="phone"
                    value={searchParams.phone}
                    onChange={handleInputChange}
                    className="pl-10 w-full bg-gray-700 rounded-lg px-4 py-2 text-sm"
                    placeholder="+1 555-123-4567"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Location/IP</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={searchParams.location}
                    onChange={handleInputChange}
                    className="pl-10 w-full bg-gray-700 rounded-lg px-4 py-2 text-sm"
                    placeholder="New York, NY or 192.168.1.1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Company/Domain</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="company"
                    value={searchParams.company}
                    onChange={handleInputChange}
                    className="pl-10 w-full bg-gray-700 rounded-lg px-4 py-2 text-sm"
                    placeholder="Acme Corp or acmecorp.com"
                  />
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Additional Information</label>
                <textarea
                  name="additionalInfo"
                  value={searchParams.additionalInfo}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-sm h-24"
                  placeholder="Any other details that might help the AI guide the investigation (hobbies, known social accounts, etc.)"
                ></textarea>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${selectedTools.sherlock ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedTools.sherlock} 
                    onChange={() => handleToolToggle('sherlock')} 
                    className="sr-only" 
                  />
                  <User size={16} />
                  <span>Username Search</span>
                </label>
                
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${selectedTools.theHarvester ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedTools.theHarvester} 
                    onChange={() => handleToolToggle('theHarvester')} 
                    className="sr-only" 
                  />
                  <Mail size={16} />
                  <span>Email Harvesting</span>
                </label>
                
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${selectedTools.whois ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedTools.whois} 
                    onChange={() => handleToolToggle('whois')} 
                    className="sr-only" 
                  />
                  <Globe size={16} />
                  <span>WHOIS Lookup</span>
                </label>
                
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${selectedTools.geoIP ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedTools.geoIP} 
                    onChange={() => handleToolToggle('geoIP')} 
                    className="sr-only" 
                  />
                  <MapPin size={16} />
                  <span>GeoIP Lookup</span>
                </label>
                
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${selectedTools.socialAnalyzer ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedTools.socialAnalyzer} 
                    onChange={() => handleToolToggle('socialAnalyzer')} 
                    className="sr-only" 
                  />
                  <Search size={16} />
                  <span>Social Analyzer</span>
                </label>
                
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${selectedTools.googleDorks ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedTools.googleDorks} 
                    onChange={() => handleToolToggle('googleDorks')} 
                    className="sr-only" 
                  />
                  <Globe size={16} />
                  <span>Google Dorks</span>
                </label>
                
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${selectedTools.imageSearch ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedTools.imageSearch} 
                    onChange={() => handleToolToggle('imageSearch')} 
                    className="sr-only" 
                  />
                  <Camera size={16} />
                  <span>Image Search</span>
                </label>
              </div>
              
              <div className="flex justify-center mt-6">
                <button
                  onClick={runSearchTools}
                  disabled={isSearching || (!searchParams.fullName && !searchParams.username && !searchParams.email && !searchParams.company)}
                  className={`px-6 py-3 rounded-lg flex items-center gap-2 text-base font-medium ${
                    isSearching || (!searchParams.fullName && !searchParams.username && !searchParams.email && !searchParams.company) 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {isSearching ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                  {isSearching ? 'Running Investigation...' : 'Begin AI-Guided Investigation'}
                </button>
              </div>
              
              {isSearching && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{searchStage}</span>
                    <span>{searchProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${searchProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "results" ? (
          <div className="space-y-6">
            {results || foundProfiles.length > 0 || searchSummary ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Investigation Results</h3>
                  <div className="flex gap-2">
                    {searchSummary && (
                      <button onClick={downloadReport} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg">
                        <Download size={16} />
                        <span>Download Report</span>
                      </button>
                    )}
                    <button onClick={clearResults} className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
                      <Trash2                       size={16} />
                      <span>Clear Results</span>
                    </button>
                  </div>
                </div>

                {foundProfiles.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Discovered Social Profiles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {foundProfiles.map((profile, index) => (
                        <a
                          key={index}
                          href={profile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-3"
                        >
                          {getSocialIcon(profile.platform)}
                          <span className="flex-1 truncate">{profile.platform}</span>
                          <span className="text-blue-400 text-sm">Visit →</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {searchSummary && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-md font-semibold">AI Analysis Summary</h4>
                    <pre className="whitespace-pre-wrap bg-gray-900 p-4 rounded-lg text-sm font-mono">
                      {searchSummary}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <AlertTriangle size={48} className="mx-auto mb-4" />
                <p>No investigation results available. Run a search to see results here.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-300 text-sm">
                Configure which OSINT tools to include in automated investigations. 
                Enabled tools will run simultaneously with AI-guided correlation of results.
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(selectedTools).map(([tool, enabled]) => (
                <div key={tool} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="capitalize">{tool}</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleToolToggle(tool)}
                      className="sr-only"
                    />
                    <span className={`slider round ${enabled ? 'bg-blue-600' : 'bg-gray-600'}`}></span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}