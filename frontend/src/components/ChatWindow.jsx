import { useEffect } from "react";
import { EmitMessage } from "../ClientSocket/ClientSocket";
import MessageBubble from "./MessageBubble";
import { useState } from "react";

export default function ChatWindow({ currentUser, selectedUser }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    EmitMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
    });
  }, []);
  const filteredMessages = messages.filter(
    (msg) =>
      (msg.sender === currentUser.id && msg.receiver === selectedUser.id) ||
      (msg.sender === selectedUser.id && msg.receiver === currentUser.id)
  );



  return (
    <div className="flex-1 p-6 overflow-y-auto flex flex-col">
      <div className="flex-1"></div>
      <div className="space-y-4">
        {filteredMessages.map((msg, index) => (
          <MessageBubble
            key={msg.id || index}
            msg={msg.message}
            self={msg.sender === currentUser.id}
          />
        ))}
      </div>
    </div>
  );
}