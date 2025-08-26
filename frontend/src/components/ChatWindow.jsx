import { useEffect, useRef, useState } from "react";
import { ChangeStatus, EmitMessage, TypingIndicator,StopTypingIndicator } from "../ClientSocket/ClientSocket";
import MessageBubble from "./MessageBubble";
import TypingBubble from "./TypingBubble";
import { FiPhone, FiVideo, FiMoreVertical } from "react-icons/fi";
import VideoCall from "./VideoCall";

export default function ChatWindow({ currentUser, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

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
    ChangeStatus((msg) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.tempId == msg.tempId) 
          {
            return { ...m, status: "sent"};
          } 
          else 
          {
            return m;
          }
        })
      );
    });
  }, []);

  useEffect(() => {
    EmitMessage((msg) => {
      if (msg && msg.message) 
      {
        setMessages((prev) => [
          ...prev, 
          { 
            content: msg.message, 
            tempId: msg.tempId, 
            status: msg.sender === currentUser._id ? "not_delivered" : undefined,
            ...msg 
          }
        ]);
      } else if (typeof msg === "string") {
        setMessages((prev) => [...prev, { content: msg }]);
      }
    });
  }, [currentUser._id]); 

  useEffect(() => {
  TypingIndicator(({ sender }) => 
  {
    if (sender === selectedUser._id) 
    {
       setIsOtherUserTyping(true)
    }
  })
  StopTypingIndicator(({ sender }) => {
    if (sender === selectedUser._id) 
    {
      setIsOtherUserTyping(false);
    }
  });
  }, [selectedUser._id]);

  useEffect(() => {
    if (bottomRef.current) {
      requestAnimationFrame(() => {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages])

    useEffect(() => {
    if (isOtherUserTyping) 
    {
      if (bottomRef.current) 
      {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } 
    else 
    {
      if (messagesContainerRef.current) 
      {
        const messageDivs = messagesContainerRef.current.querySelectorAll(".message-bubble");
        if (messageDivs.length > 0) 
        {
          messageDivs[messageDivs.length - 1].scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [isOtherUserTyping]);

  const filteredMessages = messages.filter(
    (msg) =>
      (msg.sender === currentUser._id && msg.receiver === selectedUser._id) ||
      (msg.sender === selectedUser._id && msg.receiver === currentUser._id)
  );

  const groupMessagesByDate = (messages) => {
    const groups = {};

    messages.forEach((msg) => {
      const date = new Date(msg.createdAt || Date.now()).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });

    return groups
  }

  const messageGroups = groupMessagesByDate(filteredMessages);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-black">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium">
            {selectedUser.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="ml-3">
            <div className="font-medium">{selectedUser.username}</div>
            <div className="text-xs text-gray-400">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
              {selectedUser.online ? "Online" : "Offline"}
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="p-2 rounded-full hover:bg-gray-900 text-gray-400 hover:text-amber-400 transition-colors">
            <FiPhone size={20} />
          </button>
          <button
            className="p-2 rounded-full hover:bg-gray-900 text-gray-400 hover:text-amber-400 transition-colors"
            onClick={() => setShowVideoCall(true)}
          >
            <FiVideo size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-900 text-gray-400 hover:text-white transition-colors">
            <FiMoreVertical size={20} />
          </button>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 p-4 overflow-y-auto bg-black custom-scrollbar"
      >
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date} className="mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-900 text-gray-400 text-xs px-3 py-1 rounded-sm">
                {date}
              </div>
            </div>
            <div className="space-y-3">
              {msgs.map((msg, index) => (
                <MessageBubble
                  key={msg._id || index}
                  msg={msg.content}
                  self={msg.sender === currentUser._id}
                  timestamp={new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  status={msg.status}
                  className="message-bubble"
                />
              ))}
            </div>
          </div>
        ))}
        {isOtherUserTyping && <TypingBubble />}
        <div ref={bottomRef} className="h-1 bg-transparent" />
      </div>
      {showVideoCall && (
        <VideoCall onHangUp={() => setShowVideoCall(false)} />
      )}
    </div>
  );
}