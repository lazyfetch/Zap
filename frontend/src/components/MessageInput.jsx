import { useState, useRef } from "react";
import { ClientSocket, TypingStarted, TypingStopped } from "../ClientSocket/ClientSocket.jsx";
import { FiSend, FiSmile, FiPaperclip, FiMic } from "react-icons/fi";

export default function MessageInput({ selectedUser, currentUser }) {
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() === "") return;
    let tempId = Date.now() + Math.random();
    ClientSocket(message, currentUser._id, selectedUser._id, tempId);
    TypingStopped(currentUser._id, selectedUser._id);
    setMessage("");
    if (inputRef.current) inputRef.current.blur()
  };

  return (
    <div className="border-t border-gray-900 bg-black p-4">
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 rounded-md text-gray-500 hover:text-amber-400 hover:bg-gray-900"
        >
          <FiSmile size={22} />
        </button>
        <button
          type="button"
          className="p-2 rounded-md text-gray-500 hover:text-amber-400 hover:bg-gray-900"
        >
          <FiPaperclip size={22} />
        </button>

        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-black border border-gray-800 rounded-md px-4 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-700"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => TypingStarted(currentUser._id, selectedUser._id)}
          onBlur={() => TypingStopped(currentUser._id, selectedUser._id)}
        />

        <button
          type="button"
          className="p-2 rounded-md text-gray-500 hover:text-amber-400 hover:bg-gray-900"
        >
          <FiMic size={22} />
        </button>

        <button
          type="submit"
          className={`p-3 rounded-md ${
            message.trim() === ""
              ? "bg-gray-900 text-gray-600"
              : "bg-black text-amber-400 hover:text-amber-300 border border-amber-900 hover:border-amber-700"
          }`}
          disabled={message.trim() === ""}
        >
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
}