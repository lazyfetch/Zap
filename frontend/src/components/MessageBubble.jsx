import React from 'react';

function getBubbleColor(self, status) {
  if (!self) {
    return "bg-gray-900 text-gray-300";
  }
  if (status === "not_delivered") {
    return "bg-gray-700 text-gray-200";
  }
  if (status === "delivered") {
    return "bg-emerald-800 text-white";
  }
  if (status === "seen") {
    return "bg-blue-900 text-white";
  }
  return "bg-gray-800 text-white";
}

export default function MessageBubble({ msg, self, timestamp, status = "delivered" }) {
  return (
    <div className={`flex ${self ? "justify-end" : "justify-start"} group animate-fade-in`}>
      <div className="max-w-md">
        <div className={`px-4 py-3 rounded-2xl break-words shadow-md ${getBubbleColor(self, status)}`}>
          {msg}
        </div>
        <div className={`flex mt-1 text-xs text-gray-500 ${self ? 'justify-end' : 'justify-start'}`}>
          <span>{timestamp}</span>
        </div>
      </div>
    </div>
  );
}