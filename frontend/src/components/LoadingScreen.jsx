import React from "react";

const LoadingScreen = ({ message = "Initializing call..." }) => (
  <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
    <div className="text-white text-2xl mb-4 animate-pulse">{message}</div>
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default LoadingScreen;