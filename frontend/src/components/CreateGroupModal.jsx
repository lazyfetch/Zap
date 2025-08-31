import { useState } from "react";

export default function CreateGroupModal({ currentUser, onClose, onGroupCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    const accessToken = localStorage.getItem('accessToken');
    try {
      const response = await fetch('http://localhost:3000/api/v1/group/create-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          creatorId: currentUser._id
        }),
        credentials: 'include'
      });
      const data = await response.json();
    if (data.success) 
    {
        onGroupCreated();
    } 
    else 
    {
        alert(data.message || "Failed to create group");
    }
    } 
    catch (error) 
    {
      alert("Error creating group: ",error);
    } 
    finally
    {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4 text-white">Create New Group</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black text-white rounded-lg px-3 py-2 border border-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-700"
              placeholder="Enter group name"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black text-white rounded-lg px-3 py-2 border border-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-700"
              placeholder="Enter group description"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}