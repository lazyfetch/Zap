import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import { FiUsers } from "react-icons/fi";
import { JoinGroupRoom, OnGroupMessage} from "../ClientSocket/ClientSocket.jsx";
import GroupDetailsModal from "./GroupDetailsModal.jsx";
import FileMessageBubble from "./FileMessageBubble.jsx";

export default function GroupChatWindow({ currentUser, selectedGroup,setSelectedGroup, refreshKey }) {
  const [messages, setMessages] = useState([]);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const JoinRoom=()=>{
    JoinGroupRoom(selectedGroup._id)
  }
  useEffect(()=>{
    JoinRoom()
  },[])
  useEffect(() => {
    const getGroupMessages = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch("http://localhost:3000/api/v1/group/messages", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ groupId: selectedGroup._id }),
      });
      const data = await response.json();
      console.log("Fetched group messages response:", data);
      if (data.success) 
      {
        setMessages(Array.isArray(data.data.messages) ? data.data.messages : [])
      }
      else
      {
        setMessages([])
      }
    };
    getGroupMessages()

  }, [selectedGroup, refreshKey]);

  useEffect(() => {
    const handleGroupMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    OnGroupMessage(handleGroupMessage);

  },
  [selectedGroup._id]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    });
  }, [messages]);

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((msg) => {
      const date = new Date(msg.createdAt || Date.now()).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    console.log(groups)
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-black">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium">
            <FiUsers size={24} />
          </div>
          <div className="ml-3 cursor-pointer" onClick={() => setShowGroupDetails(true)}>
            <div className="font-medium">{selectedGroup.name}</div>
            <div className="text-xs text-gray-400">
              {selectedGroup.members.length} members
            </div>
          </div>
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
              {msgs.map((msg, index) => 
                msg.mediaType === "file" ? (
                  <FileMessageBubble
                    key={msg._id || index}
                    fileName={msg.content} 
                    fileUrl={msg.mediaUrl}
                    fileSize={msg.fileSize || 0}
                    self={msg.sender === currentUser._id}
                    timestamp={new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    status={msg.status}
                    senderName={msg.senderName}
                  />
                ) : (
                  <MessageBubble
                    key={msg._id || index}
                    msg={msg.content}
                    self={msg.sender === currentUser._id}
                    timestamp={new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    status={msg.status}
                    className="message-bubble"
                    senderName={msg.senderName}
                  />
                )
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} className="h-1 bg-transparent" />
      </div>
      {showGroupDetails && (
        <GroupDetailsModal
          group={selectedGroup}
          currentUser={currentUser}
          onClose={() => setShowGroupDetails(false)}
          onGroupUpdated={(updatedGroup) => {
            setShowGroupDetails(false)
            setSelectedGroup(updatedGroup)
          }}
        />
      )}
    </div>
  );
}