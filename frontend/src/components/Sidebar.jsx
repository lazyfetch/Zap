import { useEffect, useState } from "react";
import { JoinRoom } from "../ClientSocket/ClientSocket";
import { FiSearch, FiSettings, FiUsers, FiPlus } from "react-icons/fi"
import CreateGroupModal from "./CreateGroupModal.jsx"
import Settings from "./Settings.jsx";
import {API_URL} from "../config.js"

export default function Sidebar({ selectedUserId, onSelectUser, currentUser, setSelectedGroup, onUserUpdate, onLogout }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("chats")
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [AllGroups, setAllGroups] = useState([])
  
  const getUsers = async () => {
    const accessToken = localStorage.getItem('accessToken');  
    const response=await fetch(`${API_URL}/api/v1/users/list`,{
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
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

  const getGroups = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`${API_URL}/api/v1/group/groups`, {  
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      credentials: 'include'
    });
    const data = await response.json();
    if (!data.success) 
    {
      console.log("Error getting the groups of this user");
    }
    setGroups((data.message && data.message.groups) ? data.message.groups : [])
  }

  const getAllGroups=async()=>{
    const accessToken = localStorage.getItem('accessToken');
    const response=await fetch(`${API_URL}/api/v1/group/all`,{
      method:'GET',
      headers:{
        'Authorization':`Bearer ${accessToken}`
      },
      credentials:'include'
    })
    const data=await response.json()
    if(!data.success)
    {
      console.log("Error getting groups")
    }
    setAllGroups(data.message.groups)

  }

  useEffect(() => {
    getUsers();
    getGroups(); 
    getAllGroups()
  }, []);


  const JoinGroup=async (groupId)=>{
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`${API_URL}/api/v1/group/add-member`, {  
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      credentials: 'include',
      body:JSON.stringify({
        groupId,
        userId:currentUser._id})
    });
    const data = await response.json();
    if (!data.success) 
    {
      console.log("Error joining the group");
    }
    else
    {
      getGroups();
      getAllGroups();
    }
  }
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    user._id !== currentUser._id
  );

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black text-gray-200 rounded-lg pl-10 pr-4 py-2 border border-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-700"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
        </div>
      </div>
      
      <div className="flex border-b border-gray-800 shrink-0">
        <button 
          className={`flex-1 py-3 font-medium ${activeTab === 'chats' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveTab('chats')}
        >
          <div className="flex items-center justify-center">
            <FiUsers className="mr-2" />
            Chats
          </div>
        </button>
        <button 
          className={`flex-1 py-3 font-medium ${activeTab === 'groups' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveTab('groups')}
        >
          <div className="flex items-center justify-center">
            <FiUsers className="mr-2" />
            Groups
          </div>
        </button>
        <button 
          className={`flex-1 py-3 font-medium ${activeTab === 'settings' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveTab('settings')}
        >
          <div className="flex items-center justify-center">
            <FiSettings className="mr-2" />
            Settings
          </div>
        </button>
      </div>
      
      {activeTab === 'chats' && (
        <ul className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredUsers.map((user) => (
            <li
              key={user._id}
              className={`flex items-center px-4 py-3 hover:bg-gray-900 cursor-pointer transition-all ${
                selectedUserId === user._id ? "bg-gray-900" : ""
              }`}
              onClick={() => {
                onSelectUser(user)
                setSelectedGroup(null)
              }}
            >
              <div className="relative">
                <img
                  src={user.avatar && user.avatar !== "/avatars/default.png" 
                    ? user.avatar 
                    : `${API_URL}/avatars/default.png`
                  }
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div 
                  className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium"
                  style={{ display: 'none' }}
                >
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
              <div className="text-xs text-gray-500">
                {user.online 
                  ? "now" 
                  : user.lastSeen 
                    ? new Date(user.lastSeen).toLocaleDateString('en-GB')
                    : new Date(user.createdAt).toLocaleDateString('en-GB')
                }
              </div>
            </li>
          ))}
        </ul>
      )}

      {activeTab === 'groups' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-3 shrink-0">
            <button 
              className="w-full bg-amber-500 text-black py-2 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center"
              onClick={() => setShowCreateGroupModal(true)}
            >
              <FiPlus className="mr-2" />
              Create Group
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
            <div>
              <div className="text-xs text-amber-400 font-bold mb-2 mt-2">Your Groups</div>
              <ul>
                {groups.map((group) => (
                  <li
                    key={group._id}
                    className="flex items-center px-4 py-3 hover:bg-gray-900 cursor-pointer transition-all"
                    onClick={() => {
                      onSelectUser(null)
                      setSelectedGroup(group)
                    }}  
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium">
                      {getInitials(group.name)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-gray-400">
                        {group.members.length} members
                      </div>
                    </div>
                  </li>
                ))}
                {groups.length === 0 && (
                  <li className="text-xs text-gray-500 px-4 py-2">No groups joined yet.</li>
                )}
              </ul>
            </div>
            <div>
              <div className="text-xs text-amber-400 font-bold mb-2 mt-4">Other Groups</div>
              <ul>
                {AllGroups
                  .filter(
                    (group) =>
                      !groups.some((g) => g._id === group._id)
                  )
                  .map((group) => (
                    <li
                      key={group._id}
                      className="flex items-center px-4 py-3 hover:bg-gray-900 cursor-pointer transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium">
                        {getInitials(group.name)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-gray-400">
                          {group.members.length} members
                        </div>
                      </div>
                      <button
                        className="ml-2 px-3 py-1 bg-amber-500 text-black rounded text-xs hover:bg-amber-600"
                        onClick={async (e) => {
                          e.stopPropagation()
                          await JoinGroup(group._id)
                        }}
                      >
                        Join
                      </button>
                    </li>
                  ))}
                {AllGroups.filter((group) => !groups.some((g) => g._id === group._id)).length === 0 && (
                  <li className="text-xs text-gray-500 px-4 py-2">No other groups available.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="flex-1 overflow-hidden">
          <Settings 
            currentUser={currentUser} 
            onUserUpdate={onUserUpdate}
            onLogout={onLogout}
          />
        </div>
      )}

      {showCreateGroupModal && (
        <CreateGroupModal 
          currentUser={currentUser} 
          onClose={() => setShowCreateGroupModal(false)} 
          onGroupCreated={() => {
            getGroups()
            setShowCreateGroupModal(false)
          }}
        />
      )}
    </div>
  );
}