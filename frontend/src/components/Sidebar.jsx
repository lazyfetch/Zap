import { useEffect, useState } from "react";
import { JoinRoom } from "../ClientSocket/ClientSocket";
import { FiSearch, FiSettings, FiUsers } from "react-icons/fi";

export default function Sidebar({ selectedUserId, onSelectUser, currentUser }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const getUsers = async () => {
    const accessToken = localStorage.getItem('accessToken');  
    const response=await fetch('http://localhost:3000/api/v1/users/list',{
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body:JSON.stringify({userId:currentUser._id}),
      credentials:'include'
    })
    const data=await response.json()
    if(data.success)
    {
      setUsers(data.data)
    }
    if (!data.success) 
    {
      throw new Error(data.message || "Failed to fetch users");
    }
  };
  
  useEffect(() => {
    getUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-3 shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black text-gray-200 rounded-lg pl-10 pr-4 py-2 border border-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-700"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
        </div>
      </div>
      
      <div className="flex border-b border-gray-800 shrink-0">
        <button className="flex-1 py-3 text-amber-400 border-b-2 border-amber-500 font-medium">
          <div className="flex items-center justify-center">
            <FiUsers className="mr-2" />
            Chats
          </div>
        </button>
        <button className="flex-1 py-3 text-gray-400 hover:text-gray-200">
          <div className="flex items-center justify-center">
            <FiSettings className="mr-2" />
            Settings
          </div>
        </button>
      </div>
      
      <ul className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredUsers.map((user) => (
          <li
            key={user._id}
            className={`flex items-center px-4 py-3 hover:bg-gray-900 cursor-pointer transition-all ${
              selectedUserId === user._id ? "bg-gray-900" : ""
            }`}
            onClick={() => {
              onSelectUser(user);
            }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium">
                {getInitials(user.username)}
              </div>
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black ${
                  user.online ? "bg-green-500" : "bg-gray-600"
                }`}
              ></span>
            </div>
            <div className="ml-3 flex-1">
              <div className="font-medium">{user.username}</div>
              <div className="text-xs text-gray-400">
                {user.online ? "Online" : "Offline"}
              </div>
            </div>
            <div className="text-xs text-gray-500">12:34</div>
          </li>
        ))}
      </ul>
    </div>
  );
}