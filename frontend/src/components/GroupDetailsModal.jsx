import { useState } from "react";

export default function GroupDetailsModal({ group, currentUser, onClose, onGroupUpdated }) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAdmin = group.admins.includes(currentUser._id);

  const handleSave = async () => {
    setEditMode(false);
  };

  const handleLeave = async () => {
  };

  const handleDelete = async () => {
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <button onClick={onClose}>X</button>
        {editMode ? (
          <>
            <input value={name} onChange={e => setName(e.target.value)} />
            <textarea value={description} onChange={e => setDescription(e.target.value)} />
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setEditMode(false)}>Cancel</button>
          </>
        ) : (
          <>
            <h2>{name}</h2>
            <p>{description}</p>
            {isAdmin && <button onClick={() => setEditMode(true)}>Edit</button>}
          </>
        )}
        <h3>Members</h3>
        <ul>
          {group.members.map(member => (
            <li key={member._id}>
              {member.username}
              {group.admins.includes(member._id) && <span> (admin)</span>}
            </li>
          ))}
        </ul>
        <button onClick={handleLeave}>Leave Group</button>
        {isAdmin && (
          <>
            <button onClick={() => setShowDeleteConfirm(true)}>Delete Group</button>
            {showDeleteConfirm && (
              <div>
                <p>Are you sure you want to delete this group?</p>
                <button onClick={handleDelete}>Yes, Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}