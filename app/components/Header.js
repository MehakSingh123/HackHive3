// components/Header.js
import { Shield, TerminalSquare } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-[#081A2C] shadow-lg py-3 px-6 flex items-center justify-between z-10 border-b border-[#00ADEE]/30">
      <div className="flex items-center space-x-3">
        <div className="text-[#00ADEE]">
          <TerminalSquare size={28} strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-white">
          Hack<span className="text-[#00ADEE]">Hive</span>
        </h1>
      </div>
      <nav>
        <ul className="flex space-x-8">
          <li>
            <Link href="/" className="text-white hover:text-[#00ADEE] transition-colors font-medium flex items-center gap-1.5">
              Home
            </Link>
          </li>
          <li>
            <Link href="/tools" className="text-white hover:text-[#00ADEE] transition-colors font-medium flex items-center gap-1.5">
              Tools
            </Link>
          </li>
          <li>
            <Link href="/ai" className="text-white hover:text-[#00ADEE] transition-colors font-medium flex items-center gap-1.5">
              AI Assistant
            </Link>
          </li>
          <li>
            <Link href="#" className="text-white hover:text-[#00ADEE] transition-colors font-medium flex items-center gap-1.5">
              Documentation
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}