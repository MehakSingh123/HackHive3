// app/layout.js
import "./globals.css";
import Providers from "./components/Providers"; // Assuming this includes ThemeProvider etc.
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
// REMOVE direct imports of AIChat and Terminal if they existed

// Import the Window Management components
import { WindowManagerProvider } from "./contexts/WindowManagerContext"; // Adjust path if needed
import WindowManager from "./components/WindowManager"; // Adjust path if needed
import Taskbar from "./components/Taskbar"; // Adjust path if needed
import { TerminalProvider } from "./contexts/TerminalContext"; // Keep Terminal context for Terminal Window Content
import { AIChatProvider } from "./contexts/AIChatContext"; // Keep AI Chat context for Chat Window Content

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            {/* Add overflow-hidden to prevent body scrollbars interfering with window bounds */}
            <body className="overflow-hidden bg-gray-900"> {/* Moved bg color here */}
                {/* Providers should wrap everything that needs context */}
                <Providers>
                     {/* Context Providers specific to window contents */}
                     <TerminalProvider>
                         <AIChatProvider>
                             {/* WindowManagerProvider needs to wrap components using its context */}
                             <WindowManagerProvider>
                                 <div className="flex flex-col h-screen text-white"> {/* Use h-screen */}
                                      <Header />
                                      <div className="flex flex-1 overflow-hidden"> {/* Prevent this level from scrolling */}
                                          <Sidebar />
                                          {/* Main content area - Make it relative for window bounds */}
                                          <main id="main-content-area" className="flex-1 overflow-y-auto p-6 relative bg-gray-900"> {/* Added relative, ID, and bg */}
                                              {children}
                                              {/* Window Manager renders floating windows *over* the main content */}
                                              <WindowManager />
                                          </main>
                                      </div>
                                      {/* Taskbar sits at the bottom */}
                                      <Taskbar />
                                  </div>
                             </WindowManagerProvider>
                         </AIChatProvider>
                    </TerminalProvider>
                </Providers>
            </body>
        </html>
    );
}