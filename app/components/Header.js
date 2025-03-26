// components/Header.js
import { Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-gray-800 shadow-lg py-4 px-6 flex items-center justify-between z-10">
      <div className="flex items-center space-x-2">
        <Zap size={24} className="text-green-400" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          HackHive
        </h1>
      </div>
      <nav>
        <ul className="flex space-x-6">
          <li>
            <a href="/" className="hover:text-green-400 transition-colors">
              Home
            </a>
          </li>
          <li>
            <a href="/tools" className="hover:text-green-400 transition-colors">
              Tools
            </a>
          </li>
          <li>
            <a href="/ai" className="hover:text-green-400 transition-colors">
              AI Assistant
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-green-400 transition-colors">
              Documentation
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
