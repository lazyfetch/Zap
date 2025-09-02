import { useState, useRef } from "react";
import { FiSend, FiSmile, FiPaperclip, FiMic } from "react-icons/fi";
import { SendGroupMessage } from "../ClientSocket/ClientSocket.jsx";
import {API_URL} from "../config.js"
export default function GroupMessageInput({ selectedGroup, currentUser, onMessageSent }) {
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [errorDialog, setErrorDialog] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const MAX_SIZE = 10 * 1024 * 1024
  const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/csv", "application/xml", "text/plain", "image/jpeg", "image/png"]

  const handleSend = async (e) => {
    e.preventDefault();
    if (message.trim() === "" && !selectedFile) 
    {
      return
    }
    
    setIsSending(true)
    let tempId = Date.now() + Math.random();
    let fileData = null;

    if (selectedFile) 
    {
      try 
      {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const accessToken = localStorage.getItem("accessToken");
        const response = await fetch(`${API_URL}/api/v1/file/upload-file`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
          credentials: 'include'
        });
        const result = await response.json();
        if (!result.success) 
        {
          throw new Error(result.message || "Upload failed")
        }
        fileData = result.data;
      } 
      catch (error) 
      {
        setErrorDialog("File upload failed: " + error.message)
        setIsSending(false)
        return
      }
    }
    SendGroupMessage({
      groupId: selectedGroup._id,
      message: message,
      sender: currentUser._id,
      tempId: tempId,
      fileData: fileData,
      createdAt: new Date().toISOString(),
      status: "sent"
    });

    setMessage("")
    setSelectedFile(null)
    setIsSending(false)
    if (inputRef.current) 
    {
      inputRef.current.blur()
    }
    if (onMessageSent) 
    {
      onMessageSent()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > MAX_SIZE) 
    {
      setErrorDialog("File size exceeds 10MB limit.")
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) 
    {
      setErrorDialog("File type not allowed.")
      return
    }
    setSelectedFile(file)
  };

  return (
    <div className="border-t border-gray-900 bg-black p-4">
      {errorDialog && (
        <div className="mb-2 p-3 bg-red-900 text-red-200 rounded flex items-center justify-between">
          <span>{errorDialog}</span>
          <button
            className="ml-4 text-red-300 hover:text-white font-bold"
            onClick={() => setErrorDialog(false)}
          >
            ×
          </button>
        </div>
      )}
      
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 rounded-md text-gray-500 hover:text-amber-400 hover:bg-gray-900"
        >
          <FiSmile size={22} />
        </button>
      
        {selectedFile && (
          <div className="flex items-center gap-2 mb-2 bg-gray-800 rounded px-3 py-1">
            <span className="text-sm text-amber-300 truncate max-w-[160px]">{selectedFile.name}</span>
            <span className="text-xs text-gray-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
            <button
              type="button"
              className="ml-2 text-gray-400 hover:text-red-500"
              onClick={() => setSelectedFile(null)}
              aria-label="Remove file"
            >
              ×
            </button>
          </div>
        )}

        <input 
          type="file"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}  
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className="p-2 rounded-md text-gray-500 hover:text-amber-400 hover:bg-gray-900"
        >
          <FiPaperclip size={22} />
        </button>
        
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-black border border-gray-800 rounded-md px-4 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-700"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="submit"
          className={`p-3 rounded-md transition-colors duration-150 ${
            isSending
              ? "bg-gray-900 text-gray-600 cursor-not-allowed"
              : (message.trim() !== "" || selectedFile)
                ? "bg-amber-400 text-black hover:bg-amber-500 border border-amber-900 hover:border-amber-700"
                : "bg-gray-900 text-gray-600"
          }`}
          disabled={isSending || (message.trim() === "" && !selectedFile)}
        >
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
}