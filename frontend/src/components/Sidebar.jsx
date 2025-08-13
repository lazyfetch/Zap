const users = [
  { id: 1, name: "A", online: true },
  { id: 2, name: "B", online: false },
  { id: 3, name: "C", online: true },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r flex flex-col">
      <div className="p-4 font-bold text-xl border-b">Chats</div>
      <ul className="flex-1 overflow-y-auto">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer"
          >
            <span
              className={`h-3 w-3 rounded-full mr-3 ${
                user.online ? "bg-green-500" : "bg-gray-400"
              }`}
            ></span>
            <span>{user.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}