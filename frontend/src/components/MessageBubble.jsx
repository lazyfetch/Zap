function getBubbleColor(self, status) {
  if (!self) 
  {
    return "bg-gray-200 text-gray-900";
  }
  if (status === "not_delivered") 
  {
    return "bg-gray-400 text-white";
  }
  if (status === "sent") 
  {
    return "bg-green-500 text-white";
  }
  if (status === "seen") 
  {
    return "bg-blue-500 text-white";
  }
  return "bg-gray-400 text-white";
}

export default function MessageBubble({ msg, self }) {
  return (
    <div className={`flex ${self ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col max-w-xs">
        <div className={`px-4 py-2 rounded-lg ${self ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"}`}>
          {msg}
        </div>
      </div>
    </div>
  );
}