import { useState } from "react";
import { ClientSocket } from "../ClientSocket/ClientSocket";


export default function MessageInput() {
  const [message, setMessage] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if(message)
    {
      ClientSocket(message)
    }
    if (message.trim() === "") return;
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSend}
      className="flex items-center p-4 border-t bg-white"
    >
      <input
        type="text"
        className="flex-1 border rounded-lg px-4 py-2 mr-2 focus:outline-none focus:ring"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
      >
        Send
      </button>
    </form>
  );
}