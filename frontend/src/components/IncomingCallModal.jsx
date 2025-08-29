import React from 'react';

const IncomingCallModal = ({ show, onAccept, onReject, caller }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-black text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold mb-4">Incoming Call</h2>
        <p className="mb-4">Call from {caller?.username || 'Unknown'}</p>
        <div className="flex space-x-4">
          <button
            onClick={onAccept}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Accept
          </button>
          <button
            onClick={onReject}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;