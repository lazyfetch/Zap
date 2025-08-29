import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash, FaSync } from "react-icons/fa";
import { useRef, useEffect, useState } from "react";
import IncomingCallModal from "./IncomingCallModal.jsx";
import { createPeerConnection } from "../webRTC/webRTCConnection";
import { sendOffer, receiveOffer, sendAnswer, receiveAnswer, sendIce, receiveIce } from "../webRTC/webRTCSockets.js";
import socket from "../socket.js";

const VideoCall = ({ isCaller, currentUser, selectedUser, onClose }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const onOffer = async ({ offer, sender }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        sendAnswer(answer, currentUser, sender);
      }
    };
    receiveOffer(onOffer);

    const onAnswer = async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };
    receiveAnswer(onAnswer);

    const onIce = ({ candidate }) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };
    receiveIce(onIce);

    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('ice');
    };
  }, [currentUser, selectedUser]);

  useEffect(() => {
    const getLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error getting media:", error);
      }
    };
    getLocalStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localStream) {
      const pc = createPeerConnection(remoteVideoRef, localStream);
      setPeerConnection(pc);
      peerConnectionRef.current = pc;
      console.log("PC MADE: ", pc);
      return () => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
      };
    }
  }, [localStream]);

  useEffect(() => {
    if (!peerConnection) return;

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendIce(event.candidate, currentUser, selectedUser);
      }
    };

    if (isCaller) {
      const createOffer = async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        sendOffer(offer, currentUser, selectedUser);
      };
      createOffer();
    }

    return () => {
      // Cleanup
    };
  }, [peerConnection, isCaller, currentUser, selectedUser]);

  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute bottom-24 right-4 w-32 h-24 rounded-lg border-2 border-white shadow-lg bg-black"
      />
      <div className="absolute bottom-5 flex gap-6 justify-center w-full">
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-800'} hover:bg-gray-700 flex items-center justify-center shadow-md`}
        >
          {isMuted ? <FaMicrophoneSlash className="text-white text-xl" /> : <FaMicrophone className="text-white text-xl" />}
        </button>
        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-800'} hover:bg-gray-700 flex items-center justify-center shadow-md`}
        >
          {isVideoOff ? <FaVideoSlash className="text-white text-xl" /> : <FaVideo className="text-white text-xl" />}
        </button>

        <button
          className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center shadow-md"
        >
          <FaSync className="text-white text-xl" />
        </button>

        <button
          onClick={() => {
            if (localStream) {
              localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close();
            }
            onClose();
          }}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg"
        >
          <FaPhoneSlash className="text-white text-2xl" />
        </button>
      </div>
    </div>
  );
}
export default VideoCall;