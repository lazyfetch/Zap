import { useState } from "react";
import { FiEdit2, FiX } from "react-icons/fi";

export default function GroupDetailsModal({ group, currentUser, onClose, onGroupUpdated }) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAdmin = group.admins.some(
    admin => admin === currentUser._id || (admin._id && admin._id === currentUser._id)
  );

  const handleSave = async () => {
    setEditMode(false);
  };

  const handleLeave = async () => {
  };

  const handleDelete = async () => {
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-black border-2 border-white/30 rounded-xl shadow-2xl w-[420px] h-[540px] p-0 relative flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">{name}</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 text-xl transition absolute top-4 right-4 shadow"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-5">
            <div className="flex items-center mb-1">
              <span className="text-gray-400 font-medium mr-2">Description</span>
              {isAdmin && !editMode && (
                <button
                  className="text-amber-400 hover:text-amber-500 p-1 rounded transition"
                  onClick={() => setEditMode(true)}
                  aria-label="Edit Description"
                >
                  <FiEdit2 size={16} />
                </button>
              )}
            </div>
            {editMode ? (
              <>
                <input
                  className="w-full mb-2 p-2 rounded bg-gray-800 text-white"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Group name"
                />
                <textarea
                  id="group-description"
                  className="w-full mb-2 p-2 rounded bg-gray-800 text-white"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Enter group description..."
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    className="bg-amber-500 text-black px-4 py-2 rounded hover:bg-amber-600"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-black rounded p-3 text-gray-200 min-h-[48px]">
                {description || <span className="text-gray-500">No description</span>}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-400 mb-2">Members</h3>
            <ul className="mb-4 space-y-1">
              {group.members.map(member => (
                <li key={member._id} className="text-white flex items-center gap-2">
                  {member.username}
                  {group.admins.includes(member._id) && (
                    <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded ml-2">admin</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 pb-6 pt-2">
          <button
            className="w-[46%] bg-red-500 text-white px-4 py-2 rounded-lg text-base font-semibold hover:bg-red-600"
            onClick={handleLeave}
          >
            Leave Group
          </button>
          {isAdmin && (
            <>
              <button
                className="w-[46%] bg-gray-700 text-white px-4 py-2 rounded-lg text-base font-semibold hover:bg-gray-600"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Group
              </button>
              {showDeleteConfirm && (
                <div className="absolute left-1/2 bottom-28 transform -translate-x-1/2 bg-gray-800 p-4 rounded shadow-lg z-10 w-[90%]">
                  <p className="text-red-400 mb-2">Are you sure you want to delete this group?</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      onClick={handleDelete}
                    >
                      Yes, Delete
                    </button>
                    <button
                      className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}