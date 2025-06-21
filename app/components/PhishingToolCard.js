import React from "react";
import { X } from "lucide-react";

// PhishingToolCard component for displaying detailed information about phishing tools
const PhishingToolCard = ({ tool, onClose }) => {
  // Default iconBgColor if not provided
  const iconBgColor = tool.iconBgColor || "#1e293b";

  return (
    <div className="flex flex-col h-full">
      {/* Card Header with Icon and Title */}
      <div 
        className="flex items-center p-4 border-b border-slate-700/50 bg-slate-900/50"
      >
        {/* Tool Icon */}
        <div
          className="w-12 h-12 rounded-lg mr-4 flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: iconBgColor }}
          aria-hidden="true"
        >
          {tool.icon && typeof tool.icon === "string" ? (
            <span className="text-xl">{tool.icon}</span>
          ) : tool.icon && React.isValidElement(tool.icon) ? (
            React.cloneElement(tool.icon, { size: 24 })
          ) : (
            <div className="text-2xl font-bold">{tool.name.charAt(0)}</div>
          )}
        </div>

        {/* Title and Subtitle */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{tool.name}</h3>
          <p className="text-sm text-gray-400">{tool.groupName || "Information"}</p>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Description */}
        {tool.description && (
          <p className="text-gray-300 mb-4">{tool.description}</p>
        )}

        {/* Detailed Info Section */}
        {tool.info && (
          <div className="space-y-4">
            {/* Long Description */}
            {tool.info.description && (
              <div>
                <h4 className="text-sm uppercase text-gray-400 mb-2 font-medium">Description</h4>
                <p className="text-gray-300">{tool.info.description}</p>
              </div>
            )}

            {/* Usage Information */}
            {tool.info.usage && (
              <div>
                <h4 className="text-sm uppercase text-gray-400 mb-2 font-medium">Usage</h4>
                <p className="text-gray-300">{tool.info.usage}</p>
              </div>
            )}

            {/* Risk Information */}
            {tool.info.risk && (
              <div>
                <h4 className="text-sm uppercase text-gray-400 mb-2 font-medium">Risk Level</h4>
                <div className="flex items-center">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tool.info.risk === "High" ? "bg-red-900/50 text-red-200" : 
                    tool.info.risk === "Medium" ? "bg-yellow-900/50 text-yellow-200" : 
                    "bg-green-900/50 text-green-200"
                  }`}>
                    {tool.info.risk}
                  </div>
                </div>
              </div>
            )}

            {/* Tags/Keywords */}
            {tool.info.tags && tool.info.tags.length > 0 && (
              <div>
                <h4 className="text-sm uppercase text-gray-400 mb-2 font-medium">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {tool.info.tags.map((tag, index) => (
                    <span 
                      key={`tag-${index}`} 
                      className="px-2 py-1 bg-slate-700/50 text-gray-300 rounded-md text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm transition-colors"
          aria-label="Close"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PhishingToolCard;