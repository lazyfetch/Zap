import { useState,useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import Login from "./AuthComponents/Login";
import Register from "./AuthComponents/Register"; 
import { JoinRoom } from "./ClientSocket/ClientSocket";

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
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        selectedUserId={selectedUser?.id}
        onSelectUser={setSelectedUser}
      />
      <div className="flex flex-col flex-1">
        {selectedUser ? (
          <>
            <ChatWindow currentUser={currentUser} selectedUser={selectedUser} />
            <MessageInput selectedUser={selectedUser} currentUser={currentUser} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
