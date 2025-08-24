import { useState,useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import Login from "./AuthComponents/Login";
import Register from "./AuthComponents/Register"; 
import { JoinRoom } from "./ClientSocket/ClientSocket";
import { FiLogOut } from 'react-icons/fi';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false); 
  const checkAuth=async()=>{
      try {
        const accessToken = localStorage.getItem('accessToken');
        const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
        
        const response = await fetch('http://localhost:3000/api/v1/users/me', {
          method: 'GET',
          headers: headers,
          credentials: "include"
        });
  
        const data = await response.json()
  
        if(data.success)
        {
          setCurrentUser(data.data.user);
          JoinRoom(data.data.user._id); 
          return;
        }
  
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshResponse = await fetch('http://localhost:3000/api/v1/auth/refresh-token', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${refreshToken}` },
            credentials: "include"
          });
  
          const refreshData = await refreshResponse.json();
          if (refreshData.success) {

            localStorage.setItem('accessToken', refreshData.data.accessToken);
            localStorage.setItem('refreshToken', refreshData.data.refreshToken);
            
            const newResponse = await fetch('http://localhost:3000/api/v1/users/me', {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${refreshData.data.accessToken}` },
              credentials: "include"
            });
  
            const newData = await newResponse.json();
            if (newData.success) {
              setCurrentUser(newData.data.user);
              JoinRoom(newData.data.user._id);
            }
          }
        }
      } 
      catch (error) 
      {
        console.log(error)
      }
  }
  useEffect(()=>{
    checkAuth()
  },[])
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    JoinRoom(user._id); 
  };

  if (!currentUser) {
    return showRegister
      ? <Register onShowLogin={() => setShowRegister(false)} />
      : <Login onLoginSuccess={handleLoginSuccess} onShowRegister={() => setShowRegister(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black text-gray-100">
      <div className="flex flex-col w-72 bg-black border-r border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
          <h1 className="text-xl font-bold text-amber-400">Zap Chat</h1>
          <button 
            onClick={() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              setCurrentUser(null);
            }}
            className="p-2 rounded-full hover:bg-gray-900 text-gray-400 hover:text-amber-400"
          >
            <FiLogOut size={20} />
          </button>
        </div>
        <Sidebar
          selectedUserId={selectedUser?._id}
          onSelectUser={setSelectedUser}
          currentUser={currentUser}
        />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden bg-black">
        {selectedUser ? (
          <>
            <ChatWindow currentUser={currentUser} selectedUser={selectedUser} />
            <MessageInput selectedUser={selectedUser} currentUser={currentUser} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <p className="text-xl">Select a conversation</p>
            <p className="mt-2 text-sm">Choose a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
