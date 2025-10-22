import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import Login from "./AuthComponents/Login";
import Register from "./AuthComponents/Register"; 
import UsernameSelection from "./AuthComponents/UsernameSelection";
import { JoinRoom, emitUserOnline, emitUserOffline } from "./ClientSocket/ClientSocket";
import { FiLogOut } from 'react-icons/fi';
import GroupChatWindow from "./components/GroupChatWindow";
import {API_URL} from "./config.js"

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showRegister, setShowRegister] = useState(false); 
  const [showUsernameSelection, setShowUsernameSelection] = useState(false); 
  const [sidebarWidth, setSidebarWidth] = useState(288); 
  const [groupMessagesRefreshKey, setGroupMessagesRefreshKey] = useState(0);
  const [guestInviteLink, setGuestInviteLink] = useState(localStorage.getItem("guestInviteLink") || "");
  const [guestCopyLabel, setGuestCopyLabel] = useState("Copy Invite Link");
  const sidebarMin = 275;
  const sidebarMax = 500;
  const resizing = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('googleLogin')) 
    {
      const accessToken = urlParams.get('accessToken');
      const refreshToken = urlParams.get('refreshToken');
      const userStr = urlParams.get('user');
      
      if (accessToken && refreshToken && userStr) 
      {
        try 
        {
          const user = JSON.parse(decodeURIComponent(userStr));
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          fetch(`${API_URL}/api/v1/users/presence`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ online: true })
          });

          JoinRoom(user._id);
          emitUserOnline(user._id);
          setCurrentUser(user);

          window.history.replaceState({}, document.title, "/");
        } 
        catch (error) 
        {
          console.error('Error processing Google login:', error);
        }
      }
    }

    if (urlParams.get('showUsernameSelection')) 
    {
      setShowUsernameSelection(true);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) 
      {
        return
      }
      
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        credentials: "include"
      });

      const data = await response.json()

      if (response.ok && data.success) 
      {
        setCurrentUser(data.data.user);
        JoinRoom(data.data.user._id);

        if (data.data.user.isGuest) {
          const guestRoomResponse = await fetch(`${API_URL}/api/v1/auth/guest/room`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
            credentials: "include"
          });
          const guestRoomData = await guestRoomResponse.json();
          if (guestRoomResponse.ok && guestRoomData.success) {
            setSelectedGroup(guestRoomData.data.room);
          }
          return;
        }
        
        await fetch(`${API_URL}/api/v1/users/presence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          credentials: 'include',
          body: JSON.stringify({ online: true })
        });
        emitUserOnline(data.data.user._id)
        return
      }


      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) 
      {
        return
      }

      const refreshResponse = await fetch(`${API_URL}/api/v1/auth/refresh-token`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${refreshToken}` },
        credentials: "include"
      });

      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok && refreshData.success) {
        localStorage.setItem('accessToken', refreshData.data.accessToken);
        localStorage.setItem('refreshToken', refreshData.data.refreshToken);
        
        const newResponse = await fetch(`${API_URL}/api/v1/users/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${refreshData.data.accessToken}` },
          credentials: "include"
        });

        const newData = await newResponse.json();
        if (newResponse.ok && newData.success) {
          setCurrentUser(newData.data.user);
          JoinRoom(newData.data.user._id);

          if (newData.data.user.isGuest) {
            const guestRoomResponse = await fetch(`${API_URL}/api/v1/auth/guest/room`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${refreshData.data.accessToken}` },
              credentials: "include"
            });
            const guestRoomData = await guestRoomResponse.json();
            if (guestRoomResponse.ok && guestRoomData.success) {
              setSelectedGroup(guestRoomData.data.room);
            }
            return;
          }
          
          await fetch(`${API_URL}/api/v1/users/presence`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshData.data.accessToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ online: true })
          });
          emitUserOnline(newData.data.user._id);
        }
      } 
      else 
      { 
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } 
    catch (error) 
    {
      console.log('Auth check failed:', error.message);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  const handleLogout = async () => {
    try 
    {
      const accessToken = localStorage.getItem('accessToken');
      
      if (accessToken && currentUser) {
        if (!currentUser.isGuest) {
          await fetch(`${API_URL}/api/v1/users/presence`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            credentials: 'include',
            body: JSON.stringify({ online: false })
          });

          emitUserOffline(currentUser._id, new Date())
        }

        await fetch(`${API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          credentials: 'include'
        });
      }
    } 
    catch (error) 
    {
      console.error('Logout error:', error);
    } 
    finally 
    {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('guestInviteLink')
      setCurrentUser(null)
      setSelectedUser(null)
      setSelectedGroup(null)
      setGuestInviteLink("")
    }
  };

  useEffect(() => {
    if (!showUsernameSelection) 
    {
      checkAuth()
    }
  }, [showUsernameSelection])
  
  const handleLoginSuccess = (user, room = null, inviteLink = null) => {
    setCurrentUser(user);
    setShowUsernameSelection(false)
    JoinRoom(user._id); 

    if (user.isGuest && room) {
      setSelectedGroup(room)
      setSelectedUser(null)
    }

    if (inviteLink) {
      localStorage.setItem("guestInviteLink", inviteLink)
      setGuestInviteLink(inviteLink)
    }

    window.history.replaceState({}, document.title, "/")
  };

  const copyGuestInviteLink = async () => {
    if (!guestInviteLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(guestInviteLink)
      setGuestCopyLabel("Copied")
      setTimeout(() => setGuestCopyLabel("Copy Invite Link"), 1500)
    } catch (error) {
      setGuestCopyLabel("Copy failed")
      setTimeout(() => setGuestCopyLabel("Copy Invite Link"), 1500)
    }
  }

  const handleMouseDown = () => {
    resizing.current = true;
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!resizing.current) return;
    let newWidth = e.clientX;
    if (newWidth < sidebarMin) newWidth = sidebarMin;
    if (newWidth > sidebarMax) newWidth = sidebarMax;
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    resizing.current = false;
    document.body.style.cursor = "";
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  if (showUsernameSelection) 
  {
    return <UsernameSelection onLoginSuccess={handleLoginSuccess} />
  }

  if (!currentUser) {
    return showRegister
      ? <Register onShowLogin={() => setShowRegister(false)} />
      : <Login onLoginSuccess={handleLoginSuccess} onShowRegister={() => setShowRegister(true)} />;
  }

  if (currentUser.isGuest) {
    return (
      <div className="flex h-screen overflow-hidden bg-black text-gray-100">
        <div className="flex flex-col flex-1 overflow-hidden bg-black">
          <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
            <div>
              <h1 className="text-xl font-bold text-amber-400">Zap Demo Room</h1>
              <p className="text-xs text-gray-400 mt-1">Temporary guest session for recruiter testing</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyGuestInviteLink}
                className="px-3 py-2 rounded-md bg-amber-500 text-black hover:bg-amber-600 text-sm font-medium"
                disabled={!guestInviteLink}
              >
                {guestCopyLabel}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-900 text-gray-400 hover:text-amber-400 transition-colors"
                title="Exit Guest Session"
              >
                <FiLogOut size={20} />
              </button>
            </div>
          </div>

          {selectedGroup ? (
            <GroupChatWindow
              currentUser={currentUser}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              refreshKey={groupMessagesRefreshKey}
              isGuestMode={true}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <p className="text-gray-300">Preparing your demo room...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black text-gray-100">
      <div
        className="flex flex-col bg-black border-r border-gray-800 overflow-hidden"
        style={{ width: sidebarWidth }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
          <h1 className="text-xl font-bold text-amber-400">Zap Chat</h1>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-gray-900 text-gray-400 hover:text-amber-400 transition-colors"
            title="Logout"
          >
            <FiLogOut size={20} />
          </button>
        </div>
        <Sidebar
          selectedUserId={selectedUser?._id}
          onSelectUser={setSelectedUser}
          currentUser={currentUser}
          setSelectedGroup={setSelectedGroup}
          onUserUpdate={handleUserUpdate}
          onLogout={handleLogout}
        />
      </div>

      <div
        style={{
          width: 6,
          cursor: "col-resize",
          background: "#27272a",
          zIndex: 10,
          userSelect: "none"
        }}
        onMouseDown={handleMouseDown}
      />

      <div className="flex flex-col flex-1 overflow-hidden bg-black">
        {selectedUser ? (
          <>
            <ChatWindow currentUser={currentUser} selectedUser={selectedUser} setSelectedGroup={setSelectedGroup} />
            <MessageInput selectedUser={selectedUser} currentUser={currentUser} setSelectedGroup={setSelectedGroup} />
          </>
        ) : selectedGroup ? (
          <>
            <GroupChatWindow
              currentUser={currentUser}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              refreshKey={groupMessagesRefreshKey}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <p className="text-xl text-gray-300">Welcome, {currentUser.username}!</p>
            <p className="mt-2 text-sm">Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
