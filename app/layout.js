import "./globals.css";
import Providers from "./components/Providers";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import WindowManager from "./components/WindowManager"; // Import the WindowManager component
import Taskbar from "./components/Taskbar"; // Import the Taskbar component

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {/* Providers still wraps everything */}
        <Providers>
          <div className="flex min-h-screen bg-gray-900 text-white">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto">{children}</main>
          </div>
          {/* Add WindowManager here to render the windows */}
          <WindowManager />
          <Taskbar /> {/* Add the Taskbar component */}
        </Providers>
      </body>
    </html>
  );
}