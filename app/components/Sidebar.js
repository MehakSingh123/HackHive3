// components/Sidebar.js
"use client";
import { Server } from "lucide-react";
import { useContext, useEffect } from "react";
import { VMContext } from "../contexts/VMContext";

export default function Sidebar() {
  const { vmStatus, startVM, checkStatus, stopVM } = useContext(VMContext);

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <aside className="w-64 bg-gray-800 p-4 flex flex-col shadow-lg">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Server size={20} className="mr-2" /> Dashboard
      </h2>
      <div className="p-4 mb-4 bg-gray-700 rounded-lg">
        {vmStatus === "Started" ? (
          <button
            onClick={stopVM}
            className="w-full mb-4 py-2 px-4 rounded-md font-medium transition-all bg-red-600 hover:bg-red-500 active:scale-95"
          >
            Stop Virtual Machine
          </button>
        ) : (
          <button
            onClick={startVM}
            className="w-full mb-4 py-2 px-4 rounded-md font-medium transition-all bg-green-600 hover:bg-green-500 active:scale-95"
          >
            Start Virtual Machine
          </button>
        )}
        <div className="flex items-center justify-between">
          <span className="font-medium">Status:</span>
          <span
            className={`px-2 py-1 rounded-md text-sm ${
              vmStatus === "Started"
                ? "bg-green-600"
                : vmStatus === "Starting..." || vmStatus === "Stopping..."
                ? "bg-yellow-600"
                : vmStatus.startsWith("Error")
                ? "bg-red-600"
                : "bg-gray-600"
            }`}
          >
            {vmStatus}
          </span>
        </div>
      </div>
      <div className="mt-auto text-xs text-gray-400">
        <p>Virtual Machine Integration v1.2.0</p>
        <p>© {new Date().getFullYear()} HackHive</p>
      </div>
    </aside>
  );
}
