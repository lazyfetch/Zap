import { useState, useRef } from "react";
import { FiSend, FiSmile, FiPaperclip, FiMic } from "react-icons/fi";

export default function GroupMessageInput({ selectedGroup, currentUser, onMessageSent }) {
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault()
    if (message.trim() === "") return;
    const accessToken = localStorage.getItem("accessToken");
    await fetch("http://localhost:3000/api/v1/group/create-message", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        content: message,
        group: selectedGroup
      }),
    })
    setMessage("")
    if (inputRef.current)
    {
      inputRef.current.blur()
    }
    if (onMessageSent)
    {
      onMessageSent()
    }
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