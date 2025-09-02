import { FiDownload, FiFile, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { useState } from "react";

function getBubbleColor(self, status) {
  if (!self) return "bg-gray-800 text-white";
  
  if (status === "not_delivered") return "bg-gray-700 text-gray-200";
  if (status === "sent") return "bg-emerald-800 text-white";
  if (status === "read") return "bg-blue-500 text-white";
  
  return "bg-gray-700 text-gray-200"
}

export default function FileMessageBubble({ fileName, fileUrl, fileSize, self, timestamp, status = "not_delivered", senderName, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(fileUrl, '_blank');
    }
  }

  return (
    <div className={`flex ${self ? "justify-end" : "justify-start"} group animate-fade-in relative`}>
      <div className="max-w-md relative">
        {self && (
          <div 
            className={`absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${showMenu ? 'opacity-100' : ''}`}
          >
            <button
              className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-gray-300 transition-colors"
              onClick={() => setShowMenu(!showMenu)}
            >
              <FiMoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="absolute left-0 top-8 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
                <button
                  className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                >
                  <FiTrash2 size={14} className="mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        <div className={`px-4 py-3 rounded-2xl shadow-md ${getBubbleColor(self, status)}`}>
          {!self && senderName && (
            <div className="text-xs text-gray-300 mb-1">{senderName}</div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <FiFile size={24} className="text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{fileName}</div>
              <div className="text-xs text-gray-400">{formatFileSize(fileSize)}</div>
            </div>
            <button 
              onClick={handleDownload}
              className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              <FiDownload size={16} className="text-white" />
            </button>
          </div>
        </div>
        <div className={`flex mt-1 text-xs text-gray-500 ${self ? 'justify-end' : 'justify-start'}`}>
          <span>{timestamp}</span>
        </div>
      </div>

      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}