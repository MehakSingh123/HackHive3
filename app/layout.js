// app/layout.js

import "./globals.css";
import Providers from "./components/Providers"; // Includes Theme, AIChat, Terminal contexts etc.
import { WindowManagerProvider } from "./contexts/WindowManagerContext"; // Import Window Manager
// REMOVE THE LINE BELOW - AppInitializer component was not created
// import AppInitializer from "./components/AppInitializer";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="overflow-hidden"> {/* Prevent body scroll */}
                 {/* Providers should wrap everything, including WindowManager */}
                 <Providers>
                     <WindowManagerProvider>
                         {/* Render the page content provided by Next.js routing */}
                         {children}
                     </WindowManagerProvider>
                 </Providers>
            </body>
        </html>
    );
}