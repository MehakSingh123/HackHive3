// app/layout.js

import "./globals.css";
import Providers from "./components/Providers";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import AIChat from "./components/AIChat";
import Terminal from "./components/Terminal";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <Providers>
          <div className="flex min-h-screen bg-gray-900 text-white">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto">{children}</main>
          </div>
          <Terminal />
          <AIChat />
        </Providers>
      </body>
    </html>
  );
}