import { useEffect, useRef, useState } from "react";
import { ChangeStatus, EmitMessage, TypingIndicator,StopTypingIndicator, deleteMessage, onDeleteMessage, readMessages, onReadMessages, onUserOnline, onUserOffline } from "../ClientSocket/ClientSocket.jsx";
import MessageBubble from "./MessageBubble.jsx";
import TypingBubble from "./TypingBubble.jsx";
import { FiPhone, FiVideo, FiMoreVertical } from "react-icons/fi";
import VideoCall from "./VideoCall.jsx";
import { StartCall, ReceiveCall, receiveEndCall, sendEndCall,sendRejectCall } from "../webRTC/webRTCSockets.js"; 
import IncomingCallModal from "./IncomingCallModal.jsx";
import FileMessageBubble from "./FileMessageBubble.jsx";
import socket from "../socket.js";

export default function ChatWindow({ currentUser, selectedUser, setSelectedGroup }) {
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isVideoCallVisible, setIsVideoCallVisible] = useState(false); 
  const [isCaller, setIsCaller] = useState(false);
  const [userStatus, setUserStatus] = useState({
    online: selectedUser.online || false,
    lastSeen: selectedUser.lastSeen || null
  });

  const fetchUserStatus = async () => {
    try 
    {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/api/v1/users/presence/${selectedUser._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUserStatus({
          online: data.data.online,
          lastSeen: data.data.lastSeen
        });
      }
    } 
    catch (error) 
    {
      console.error('Error fetching user status:', error);
      setUserStatus({
        online: selectedUser.online || false,
        lastSeen: selectedUser.lastSeen || null
      });
    }
  };

  useEffect(() => {
    fetchUserStatus();
  }, [selectedUser._id]);

  const handleAccept = () => {
    setShowIncomingCallModal(false);
  };

  const handleReject = () => {
    setShowIncomingCallModal(false);
    setIsVideoCallVisible(false);
    sendRejectCall(currentUser, selectedUser);
  };

  useEffect(() => {
    const onEndCall = () => {
      setIsVideoCallVisible(false);
      
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => {
        if (video.srcObject) {
          const stream = video.srcObject;
          stream.getTracks().forEach(track => {
            track.stop();
          });
          video.srcObject = null;
        }
      });
    };
    receiveEndCall(onEndCall);
    
    return () => {
      socket.off('end call');
    };
  }, []);

  useEffect(() => {
  const onCall = (data) => {
    setIncomingCallData(data);
    setShowIncomingCallModal(true);
    setIsCaller(false);
    setIsVideoCallVisible(true);
  };
  ReceiveCall(onCall);
}, []);

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
    EmitMessage((msg) => {
      if (msg && (msg.message || msg.fileData)) 
      {
        const messageObj = {
          content: msg.message || (msg.fileData ? msg.fileData.data.originalName : "File attachment"), 
          tempId: msg.tempId,
          status: msg.sender === currentUser._id ? "not_delivered" : undefined,
          sender: msg.sender,
          receiver: msg.receiver,
          createdAt: new Date().toISOString()
        };

        if (msg.fileData) 
        {
          messageObj.mediaType = "file"
          messageObj.mediaUrl = msg.fileData.data.url
          messageObj.fileSize = msg.fileData.data.size
        }

        setMessages((prev) => [...prev, messageObj])
      } 
      else if (typeof msg === "string") 
      {
        setMessages((prev) => [...prev, { content: msg }])
      }
    });
  }, [currentUser._id])

  useEffect(() => {
  TypingIndicator(({ sender }) => {
    if (sender === selectedUser._id) 
    {
       setIsOtherUserTyping(true)
    }
  })
  StopTypingIndicator(({ sender }) => {
    if (sender === selectedUser._id) 
    {
      setIsOtherUserTyping(false)
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
  const handleDeleteMessage=async(msg)=>{
    deleteMessage(msg,selectedUser)
    setMessages(prev =>
      prev.filter(m => m._id !== msg._id && m.tempId !== msg.tempId)
    )
    if (msg._id) {
    const accessToken = localStorage.getItem("accessToken");
      await fetch("http://localhost:3000/api/v1/users/delete-message", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messageId: msg._id }),
      })
    }
  }
  
  useEffect(() => {
    onDeleteMessage((msg) => {
      setMessages(prev =>
        prev.filter(m => m._id !== msg._id && m.tempId !== msg.tempId)
      )
    })
  },[])
  
  const groupMessagesByDate = (messages) => {
    const groups = {};

    messages.forEach((msg) => {
      const date = new Date(msg.createdAt || Date.now()).toLocaleDateString('en-GB')
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });

    return groups
  }

  useEffect(() => {
    const unreadMessages = messages.filter(
      m => m.receiver === currentUser._id && m.status !== "read"
    )
    if (unreadMessages.length > 0) 
    {
      const messageIds = unreadMessages.map(m => m._id).filter(id => id)
      if (messageIds.length > 0) {
        const accessToken = localStorage.getItem("accessToken");
        fetch("http://localhost:3000/api/v1/users/read-messages", {
          method: "POST", 
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ messageIds }),
        }).then(() => {
          readMessages(currentUser._id, selectedUser._id, messageIds)
        });
      }
    }
  }, [messages, selectedUser])

  useEffect(() => {
    onReadMessages((data) => { 
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

  const messageGroups = groupMessagesByDate(filteredMessages);

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Last seen recently";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) 
    {
      return "Last seen just now"
    }
      
    if (diffInMinutes < 60)
    {
      return `Last seen ${diffInMinutes}m ago`
    }
    if (diffInMinutes < 1440)
    {
      return `Last seen ${Math.floor(diffInMinutes / 60)}h ago`
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0)
    
    if (date >= today) 
    {
      return `Last seen today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } 
    else 
    {
      return `Last seen ${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
  }

  useEffect(() => {
    onUserOnline(({ userId }) => {
      if (userId === selectedUser._id) {
        setUserStatus(prev => ({ ...prev, online: true }));
      }
    });

    onUserOffline(({ userId, lastSeen }) => {
      if (userId === selectedUser._id) {
        setUserStatus(prev => ({ ...prev, online: false, lastSeen }));
      }
    });
  }, [selectedUser._id]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-black">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium">
            {selectedUser.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="ml-3">
            <div className="font-medium">{selectedUser.username}</div>
            <div className="text-xs text-gray-400 flex items-center">
              <span 
                className={`inline-block h-2 w-2 rounded-full mr-1 ${
                  userStatus.online ? 'bg-green-500' : 'bg-gray-500'
                }`}
              ></span>
              {userStatus.online ? "Online" : formatLastSeen(userStatus.lastSeen)}
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="p-2 rounded-full hover:bg-gray-900 text-gray-400 hover:text-amber-400 transition-colors">
            <FiPhone size={20} />
          </button>
          <button
            className="p-2 rounded-full hover:bg-gray-900 text-gray-400 hover:text-amber-400 transition-colors"
            onClick={() => {
              StartCall(currentUser, selectedUser);
              setIsCaller(true);
              setIsVideoCallVisible(true);
            }}
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
        {isOtherUserTyping && <TypingBubble />}
        <div ref={bottomRef} className="h-1 bg-transparent" />
      </div>
      {isVideoCallVisible && 
      <VideoCall 
        isCaller={isCaller} 
        currentUser={currentUser} 
        selectedUser={selectedUser} 
        onClose={() => {
          setIsVideoCallVisible(false);
          sendEndCall(currentUser, selectedUser);
        }} 
      />}
      <IncomingCallModal
        show={showIncomingCallModal}
        onAccept={handleAccept}
        onReject={handleReject}
        caller={incomingCallData?.sender}
      />
    </div>
  );
}