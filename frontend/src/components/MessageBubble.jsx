import React, { useState } from 'react';
import { FiMoreVertical, FiTrash2 } from "react-icons/fi";

function getBubbleColor(self, status) {
  if (!self) return "bg-gray-800 text-white";
  
  if (status === "not_delivered") return "bg-gray-700 text-gray-200";
  if (status === "sent") return "bg-emerald-800 text-white";
  if (status === "read") return "bg-blue-500 text-white";
  
  return "bg-gray-700 text-gray-200"
}

export default function MessageBubble({ msg, self, timestamp, status = "not_delivered", onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={`flex ${self ? "justify-end" : "justify-start"} group animate-fade-in relative`}>
      <div className="max-w-md relative">
        {self && (
          <div 
            className={`absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${showMenu ? 'opacity-100' : ''}`}
          >
            <button
              className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-gray-300 transition-colors"
              onClick={() => setShowMenu(!showMenu)}
            >
              <FiMoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="absolute left-0 top-8 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
                <button
                  className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                >
                  <FiTrash2 size={14} className="mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        <div className={`px-4 py-3 rounded-2xl break-words shadow-md ${getBubbleColor(self, status)}`}>
          {msg}
        </div>
        <div className={`flex mt-1 text-xs text-gray-500 ${self ? 'justify-end' : 'justify-start'}`}>
          <span>{timestamp}</span>
        </div>
      </div>

      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}