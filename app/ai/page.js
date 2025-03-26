import { Zap } from "lucide-react";

export default function AiPage() {
  return (
    <>
      <h2 className="text-xl font-bold mb-3">AI Analysis & Insights</h2>
      <div className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700">
        <div className="flex items-center mb-4">
          <div className="bg-purple-900/40 p-2 rounded-md mr-3">
            <Zap size={20} className="text-purple-400" />
          </div>
          <h3 className="font-medium">AI Security Assistant</h3>
        </div>
        <p className="text-gray-400 mb-4">
          The AI assistant can analyze your system state, recommend security
          improvements, and help interpret logs.
        </p>
        <button className="w-full py-2 px-4 rounded-md font-medium bg-purple-600 hover:bg-purple-500 active:scale-95">
          Request Detailed Analysis
        </button>
      </div>
    </>
  );
}
