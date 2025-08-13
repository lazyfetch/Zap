const messages = [
  {
    id: 1,
    sender: "A",
    text: "Hi there!",
    self: false,
    time: "10:00 AM",
    status: "not_delivered",
  },
  {
    id: 2,
    sender: "Me",
    text: "Hello!",
    self: true,
    time: "10:01 AM",
    status: "seen",
  },
  {
    id: 3,
    sender: "A",
    text: "How are you?",
    self: false,
    time: "10:02 AM",
    status: "not_delivered",
  },
  {
    id: 4,
    sender: "Me",
    text: "I'm good, thanks!",
    self: true,
    time: "10:03 AM",
    status: "sent",
  },
  {
    id: 5,
    sender: "Me",
    text: "Did you get my last message?",
    self: true,
    time: "10:04 AM",
    status: "not_delivered",
  },
];

function getBubbleColor(self, status) {
  if (!self) return "bg-gray-200 text-gray-900";
  if (status === "not_delivered") return "bg-gray-400 text-white";
  if (status === "sent") return "bg-green-500 text-white";
  if (status === "seen") return "bg-blue-500 text-white";
  return "bg-gray-400 text-white";
}

export default function ChatWindow() {
  return (
    <div className="flex-1 p-6 overflow-y-auto flex flex-col">
      <div className="flex-1"></div>
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.self ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex flex-col max-w-xs`}>
              <div
                className={`px-4 py-2 rounded-lg ${getBubbleColor(
                  msg.self,
                  msg.status
                )}`}
              >
                {msg.text}
              </div>
              <span
                className={`text-xs text-gray-400 mt-1 ${
                  msg.self ? "text-right" : "text-left"
                }`}
              >
                {msg.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}