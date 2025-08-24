import { useEffect, useRef, useState } from "react";
import { EmitMessage } from "../ClientSocket/ClientSocket";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ currentUser, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  const getMessages = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await fetch("http://localhost:3000/api/v1/users/messages", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ userId: currentUser._id, otherUserId: selectedUser._id }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch messages");
    }
    setMessages(data.data);
  };

  useEffect(() => {
    getMessages();
  }, [currentUser, selectedUser]);

  useEffect(() => {
    EmitMessage((msg) => {
      if (msg && msg.message) {
        setMessages((prev) => [...prev, { content: msg.message, ...msg }]);
      } else if (typeof msg === "string") {
        setMessages((prev) => [...prev, { content: msg }]);
      }
    });
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const filteredMessages = messages.filter(
    (msg) =>
      (msg.sender === currentUser._id && msg.receiver === selectedUser._id) ||
      (msg.sender === selectedUser._id && msg.receiver === currentUser._id)
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto flex flex-col">
      <div className="mb-4 pb-2 border-b flex items-center">
        <span className="font-bold text-lg">{selectedUser.username}</span>
      </div>
      <div className="flex-1"></div>
      <div className="space-y-4">
        {filteredMessages.map((msg, index) => (
          <MessageBubble
            key={msg.id || index}
            msg={msg.content}
            self={msg.sender === currentUser._id}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}