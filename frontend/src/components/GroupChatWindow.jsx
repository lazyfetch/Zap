import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import { FiUsers } from "react-icons/fi";
import { JoinGroupRoom, OnGroupMessage, ChangeStatus, deleteGroupMessage, onDeleteGroupMessage, readGroupMessages, onReadGroupMessages } from "../ClientSocket/ClientSocket.jsx";
import GroupDetailsModal from "./GroupDetailsModal.jsx";
import FileMessageBubble from "./FileMessageBubble.jsx";
import GroupMessageInput from "./GroupMessageInput.jsx";
import {API_URL} from "../config.js"

export default function GroupChatWindow({ currentUser, selectedGroup, setSelectedGroup, refreshKey }) {
  const [messages, setMessages] = useState([]);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const JoinRoom = () => {
    JoinGroupRoom(selectedGroup._id)
  }
  
  useEffect(() => {
    JoinRoom()
  }, [])

  useEffect(() => {
    const getGroupMessages = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/v1/group/messages`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ groupId: selectedGroup._id }),
      });
      const data = await response.json();
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
      if (msg && (msg.message || msg.fileData)) {
        const messageObj = {
          content: msg.message || (msg.fileData ? msg.fileData.data.originalName : "File attachment"),
          tempId: msg.tempId,
          status: msg.sender === currentUser._id ? "not_delivered" : undefined,
          sender: msg.sender,
          roomId: msg.groupId,
          createdAt: new Date().toISOString()
        }

        if (msg.fileData) 
        {
          messageObj.mediaType = "file";
          messageObj.mediaUrl = msg.fileData.data.url;
          messageObj.fileSize = msg.fileData.data.size;
        }

        setMessages((prev) => [...prev, messageObj]);
      } 
      else if (typeof msg === "string") 
      {
        setMessages((prev) => [...prev, { content: msg }]);
      } 
      else 
      {
        setMessages((prev) => [...prev, msg]);
      }
    };
    OnGroupMessage(handleGroupMessage);
  }, [selectedGroup._id, currentUser._id])

  useEffect(() => {
    ChangeStatus((msg) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.tempId == msg.tempId) 
          {
            return { ...msg, tempId: m.tempId };
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
    const unreadMessages = messages.filter(
      m => m.sender !== currentUser._id && 
           m.status !== "read" && 
           m._id 
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(m => m._id);
      const accessToken = localStorage.getItem("accessToken");
      
      fetch(`${API_URL}/api/v1/group/read-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messageIds, groupId: selectedGroup._id }),
      }).then(response => {
        if (response.ok) 
        {
          readGroupMessages(currentUser._id, selectedGroup._id, messageIds);
        }
      }).catch(error => {
        console.error('Failed to mark group messages as read:', error);
      });
    }
  }, [messages, selectedGroup, currentUser._id]);

  useEffect(() => {
    onReadGroupMessages((data) => {
      const { sender, messageIds } = data;
      
      if (Array.isArray(messageIds)) {
        setMessages(prev =>
          prev.map(msg =>
            messageIds.includes(msg._id)
              ? { ...msg, status: "read" }
              : msg
          )
        );
      }
    });
  }, []);

  const handleDeleteMessage = async (msg) => {
    deleteGroupMessage(msg, selectedGroup)
    setMessages(prev =>
      prev.filter(m => m._id !== msg._id && m.tempId !== msg.tempId)
    )
    if (msg._id) {
      const accessToken = localStorage.getItem("accessToken");
      await fetch(`${API_URL}/api/v1/group/delete-message`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messageId: msg._id, groupId: selectedGroup._id }),
      })
    }
  }

  useEffect(() => {
    onDeleteGroupMessage((msg) => {
      setMessages(prev =>
        prev.filter(m => m._id !== msg._id && m.tempId !== msg.tempId)
      );
    });
  }, []);

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
    return groups
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
                    status={msg.sender === currentUser._id ? msg.status : undefined} 
                    senderName={msg.senderName}
                    onDelete={() => handleDeleteMessage(msg)}
                  />
                ) : (
                  <MessageBubble
                    key={msg._id || index}
                    msg={msg.content}
                    self={msg.sender === currentUser._id}
                    timestamp={new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    status={msg.sender === currentUser._id ? msg.status : undefined}
                    className="message-bubble"
                    senderName={msg.senderName}
                    onDelete={() => handleDeleteMessage(msg)}
                  />
                )
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} className="h-1 bg-transparent" />
      </div>

      <GroupMessageInput
        selectedGroup={selectedGroup}
        currentUser={currentUser}
      />

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