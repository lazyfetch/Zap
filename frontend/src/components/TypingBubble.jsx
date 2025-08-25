import React from "react";

export default function TypingBubble() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-xs">
        <div className="px-4 py-3 rounded-2xl bg-sky-500 text-white flex items-center shadow-md">
          <span className="flex space-x-1">
            <span className="dot bg-white"></span>
            <span className="dot bg-white"></span>
            <span className="dot bg-white"></span>
          </span>
        </div>
      </div>
      <style>
        {`
          .dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin: 0 2px;
            opacity: 0.7;
            animation: typing-bounce 1.2s infinite;
          }
          .dot:nth-child(2) { animation-delay: 0.2s; }
          .dot:nth-child(3) { animation-delay: 0.4s; }
          @keyframes typing-bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
          }
        `}
      </style>
    </div>
  );
}