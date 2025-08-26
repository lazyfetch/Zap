import React, { useEffect, useRef } from "react";
import { getLocalStream } from "../webRTC/webrtcClient.js";
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from "react-icons/fi";

export default function VideoCall({ onHangUp }) {
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    let localStream;
    const localVideoCurrent = localVideoRef.current;
    getLocalStream().then((stream) => {
      if (localVideoCurrent) {
        localVideoCurrent.srcObject = stream;
      }
      localStream = stream;
    });
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (localVideoCurrent) {
        localVideoCurrent.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col justify-between z-50">
      <div className="flex-1 flex items-center justify-center relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain bg-black"
        />
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute bottom-8 right-8 w-48 h-36 rounded-lg border-2 border-amber-400 bg-gray-900 shadow-lg"
        />
      </div>
      <div className="flex items-center justify-center space-x-8 pb-8">
        <button
          className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-full text-2xl shadow"
          title="Mute"
        >
          <FiMic />
        </button>
        <button
          className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-full text-2xl shadow"
          title="Camera"
        >
          <FiVideo />
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full text-2xl shadow"
          onClick={onHangUp}
          title="End Call"
        >
          <FiPhoneOff />
        </button>
      </div>
    </div>
  );
}