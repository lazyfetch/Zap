import { useEffect, useState } from "react";
import { JoinRoom } from "../ClientSocket/ClientSocket";


export default function Sidebar({ selectedUserId, onSelectUser, currentUser }) {
  // console.log("Sidebar currentUser:", currentUser) 

  const [users, setUsers] = useState([]);
  const getUsers = async () => {
    // console.log("getUsers currentUser:", currentUser)
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
  }
  useEffect(()=>{
    getUsers()
  },[])

  return (
    <div className="w-64 bg-white border-r flex flex-col">
      <div className="p-4 font-bold text-xl border-b">Chats</div>
      <ul className="flex-1 overflow-y-auto">
        {users.map((user) => (
          <li
            key={user.id}
            className={`flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer ${
              selectedUserId === user.id ? "bg-gray-200" : ""
            }`}
            onClick={() => {
              onSelectUser(user)
            }}
          >
            <span
              className={`h-3 w-3 rounded-full mr-3 ${
                user.online ? "bg-green-500" : "bg-gray-400"
              }`}
            ></span>
            <span>{user.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}