import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import { JoinRoom } from "./ClientSocket/ClientSocket";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const users = [
  { id: 1, name: "A", online: true },
  { id: 2, name: "B", online: false },
  { id: 3, name: "C", online: true },
]; 
  const handleUserSelect = (user) => {
    setCurrentUser(user);
    JoinRoom(user.id);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {!currentUser ? (
        <div className="flex flex-1 items-center justify-center flex-col gap-4">
          <h2 className="text-xl font-bold mb-4">
            Select a user to simulate login:
          </h2>
          <div className="flex gap-4">
            <button
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={() => handleUserSelect(users[0])}
            >
              A
            </button>
            <button
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={() => handleUserSelect(users[1])}
            >
              B
            </button>
            <button
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={() => handleUserSelect(users[2])}
            >
              C
            </button>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

export default App;
