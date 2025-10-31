import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import { FiUsers, FiVideo } from "react-icons/fi";
import { ChangeStatus, JoinGroupRoom, OnGroupMessage, deleteGroupMessage, emitGuestMessageDelivered, emitGuestMessageRead, onDeleteGroupMessage, onGroupStopTyping, onGroupTyping, onGuestMessageDelivered, onGuestMessageRead, onReadGroupMessages, readGroupMessages } from "../ClientSocket/ClientSocket.jsx";
import GroupDetailsModal from "./GroupDetailsModal.jsx";
import FileMessageBubble from "./FileMessageBubble.jsx";
import GroupMessageInput from "./GroupMessageInput.jsx";
import TypingBubble from "./TypingBubble.jsx";
import VideoCall from "./VideoCall.jsx";
import IncomingCallModal from "./IncomingCallModal.jsx";
import { ReceiveCall, receiveEndCall, sendRejectCall, StartCall } from "../webRTC/webRTCSockets.js";
import {API_URL} from "../config.js"

export default function GroupChatWindow({ currentUser, selectedGroup, setSelectedGroup, refreshKey, isGuestMode = false }) {
  const [messages, setMessages] = useState([]);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isVideoCallVisible, setIsVideoCallVisible] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const getMemberId = (member) => {
    if (!member) {
      return null;
    }
    if (typeof member === "string") {
      return member;
    }
    return member._id || null;
  }

  const getMemberName = (member) => {
    if (!member) {
      return "Guest";
    }
    if (typeof member === "string") {
      return "Guest";
    }
    return member.username || "Guest";
  }

  const peerMember = (selectedGroup.members || []).find((member) => getMemberId(member) !== currentUser._id) || null;
  const peerUser = peerMember ? {
    _id: getMemberId(peerMember),
    username: getMemberName(peerMember),
  } : null;

  const getUserNameById = (userId) => {
    const member = (selectedGroup.members || []).find((item) => getMemberId(item) === userId)
    if (!member) {
      return "Guest";
    }
    return getMemberName(member)
  }

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
        const isSelf = msg.sender === currentUser._id
        const messageObj = {
          content: msg.message || (msg.fileData ? msg.fileData.data.originalName : "File attachment"),
          tempId: msg.tempId,
          status: isSelf ? "sent" : undefined,
          sender: msg.sender,
          senderName: msg.senderName || getUserNameById(msg.sender),
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

        if (isGuestMode && !isSelf && msg.tempId) {
          emitGuestMessageDelivered(selectedGroup._id, msg.tempId, msg.sender, currentUser._id)
        }
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
  }, [selectedGroup._id, currentUser._id, isGuestMode])

  useEffect(() => {
    if (isGuestMode) {
      return
    }

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
  }, [isGuestMode]);

  useEffect(() => {
    if (isGuestMode) {
      const unreadTempIds = messages
        .filter((m) => m.sender !== currentUser._id && m.tempId && m.status !== "read")
        .map((m) => m.tempId)

      if (unreadTempIds.length > 0 && peerUser?._id) {
        emitGuestMessageRead(selectedGroup._id, unreadTempIds, peerUser._id, currentUser._id)
      }
      return
    }

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
  }, [messages, selectedGroup, currentUser._id, isGuestMode, peerUser?._id]);

  useEffect(() => {
    onReadGroupMessages((data) => {
      const { messageIds } = data;
      
      if (Array.isArray(messageIds)) {
        setMessages(prev =>
          prev.map(msg =>
            messageIds.includes(msg._id) || messageIds.includes(msg.tempId)
              ? { ...msg, status: "read" }
              : msg
          )
        );
      }
    });
  }, []);

  useEffect(() => {
    if (!isGuestMode) {
      return
    }

    onGuestMessageDelivered(({ groupId, tempId }) => {
      if (groupId !== selectedGroup._id) {
        return
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId && msg.sender === currentUser._id && msg.status !== "read"
            ? { ...msg, status: "sent" }
            : msg
        )
      )
    })

    onGuestMessageRead(({ groupId, tempIds }) => {
      if (groupId !== selectedGroup._id || !Array.isArray(tempIds)) {
        return
      }

      setMessages((prev) =>
        prev.map((msg) =>
          tempIds.includes(msg.tempId) && msg.sender === currentUser._id
            ? { ...msg, status: "read" }
            : msg
        )
      )
    })
  }, [isGuestMode, selectedGroup._id, currentUser._id])

  useEffect(() => {
    onGroupTyping((data) => {
      if (!data || data.groupId !== selectedGroup._id || data.sender === currentUser._id) {
        return
      }

      setTypingUsers((prev) => {
        const exists = prev.some((user) => user.sender === data.sender)
        if (exists) {
          return prev
        }
        return [...prev, { sender: data.sender, senderName: data.senderName || getUserNameById(data.sender) }]
      })
    })

    onGroupStopTyping((data) => {
      if (!data || data.groupId !== selectedGroup._id) {
        return
      }

      setTypingUsers((prev) => prev.filter((user) => user.sender !== data.sender))
    })
  }, [selectedGroup._id, currentUser._id])

  useEffect(() => {
    const onCall = (data) => {
      if (!isGuestMode) {
        return
      }
      setIncomingCallData(data)
      setShowIncomingCallModal(true)
      setIsCaller(false)
      setIsVideoCallVisible(true)
    }

    ReceiveCall(onCall)
  }, [isGuestMode])

  useEffect(() => {
    const onEndCall = () => {
      setIsVideoCallVisible(false)
      setShowIncomingCallModal(false)
    }

    receiveEndCall(onEndCall)
  }, [])

  const handleStartGuestCall = () => {
    if (!peerUser?._id) {
      return
    }

    setIsCaller(true)
    setIsVideoCallVisible(true)
    StartCall(currentUser, peerUser)
  }

  const handleAcceptCall = () => {
    setShowIncomingCallModal(false)
  }

  const handleRejectCall = () => {
    setShowIncomingCallModal(false)
    setIsVideoCallVisible(false)
    if (peerUser?._id) {
      sendRejectCall(currentUser, peerUser)
    }
  }

  const typingText = typingUsers.length === 0
    ? ""
    : typingUsers.length === 1
      ? `${typingUsers[0].senderName} is typing...`
      : `${typingUsers.slice(0, 2).map((user) => user.senderName).join(", ")} are typing...`

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
          <div className="ml-3 cursor-pointer" onClick={() => !isGuestMode && setShowGroupDetails(true)}>
            <div className="font-medium">{selectedGroup.name}</div>
            <div className="text-xs text-gray-400">
              {selectedGroup.members.length} members
            </div>
          </div>
        </div>
        {isGuestMode && peerUser?._id && (
          <button
            onClick={handleStartGuestCall}
            className="p-2 rounded-full hover:bg-gray-900 text-gray-400 hover:text-amber-400 transition-colors"
            title="Start Video Call"
          >
            <FiVideo size={20} />
          </button>
        )}
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
        {typingText && <TypingBubble text={typingText} />}
        <div ref={bottomRef} className="h-1 bg-transparent" />
      </div>

      <GroupMessageInput
        selectedGroup={selectedGroup}
        currentUser={currentUser}
        isGuestMode={isGuestMode}
      />

      {showGroupDetails && !isGuestMode && (
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

      {isGuestMode && (
        <IncomingCallModal
          show={showIncomingCallModal}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          caller={incomingCallData?.sender}
        />
      )}

      {isGuestMode && isVideoCallVisible && peerUser?._id && (
        <VideoCall
          isCaller={isCaller}
          currentUser={currentUser}
          selectedUser={peerUser}
          onClose={() => setIsVideoCallVisible(false)}
        />
      )}
    </div>
  );
}