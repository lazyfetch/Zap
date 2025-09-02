import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash, FaSync} from "react-icons/fa";
import { useRef, useEffect, useState } from "react";
import LoadingScreen from "./LoadingScreen.jsx";
import { sendOffer, receiveOffer, sendAnswer, receiveAnswer, sendIce, receiveIce, sendEndCall} from "../webRTC/webRTCSockets.js";
import socket from "../socket.js";

const VideoCall = ({ isCaller, currentUser, selectedUser, onClose}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0)
  const timerRef = useRef(null)

  const iceQueueRef = useRef({});
  const [currentCamera, setCurrentCamera] = useState('user');
  const [availableCameras, setAvailableCameras] = useState([]);

  const startTimer = () =>
  {
    if (timerRef.current)
    {
      return
    }
    timerRef.current = setInterval(() =>
    {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () =>
  {
    if (timerRef.current)
    {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatDuration = (seconds) =>
  {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const createPeerConnection = () => {
    if (pcRef.current && pcRef.current.connectionState !== "closed") {
      return pcRef.current;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) 
      {
        try 
        {
          if
           (remoteVideoRef.current) 
          {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setTimeout(() => {
            try 
            {
              remoteVideoRef.current &&
                remoteVideoRef.current.play().catch(() => {});
            } 
            catch (error) 
            {
              console.log("Error setting while setting the remote stream: ",error);
            }
          }, 50);
        } 
        catch (error) 
        {
          console.log("ontrack assign error", error);
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) 
      {
        try 
        {
          sendIce(event.candidate, currentUser, selectedUser);
        } 
        catch (error) 
        {
          console.warn("sendIce failed", error);
        }
      }
    }
    pcRef.current = pc
    return pc
  }

  const attachLocalTracks = (pc, stream) => {
    if (!pc || !stream) 
    {
      return
    }
    let existingIds = [];
    if (pc.getSenders) 
    {
      existingIds = pc.getSenders().map((s) => s.track?.id).filter(Boolean)
    }
    stream.getTracks().forEach((track) => {
      if (!existingIds.includes(track.id)) 
      {
        try 
        {
          pc.addTrack(track, stream);
        } 
        catch (error) 
        {
          console.log("Error while adding tracks: ", error)
        }
      } 
      else 
      {
        console.log("Local track already added: ", track.kind);
      }
    });
  };

  const addIceSafely = async (candidate) => {
    const pc = pcRef.current;
    if (!pc || !candidate) 
    {
      return;
    }
    try 
    {
      const candidateInit = candidate;
      if (!pc.remoteDescription || !pc.remoteDescription.type) 
      {
        const key = selectedUser?._id || "peer"
        if (!iceQueueRef.current[key])
        {
          iceQueueRef.current[key] = []
        }
        iceQueueRef.current[key].push(candidateInit)
      } 
      else 
      {
        await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      }
    } 
    catch (error) 
    {
      const key = selectedUser?._id || "peer"
      if (!iceQueueRef.current[key]) 
      {
        iceQueueRef.current[key] = []
      }
      iceQueueRef.current[key].push(candidate)
      console.log("addIceSafely caught, queued candidate", error)
    }
  }

  const flushIceQueue = async () => {
    const pc = pcRef.current
    const key = selectedUser?._id || "peer";
    if (!pc || !iceQueueRef.current[key] || iceQueueRef.current[key].length === 0)
    {
      return;
    }
    while (iceQueueRef.current[key] && iceQueueRef.current[key].length) 
    {
      const candidate = iceQueueRef.current[key].shift();
      try 
      {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } 
      catch (error) 
      {
        console.log("flush addIce failed", error);
      }
    }
  };

  const cleanupCall = () => {
    try 
    {
      stopTimer()
      if (localStreamRef.current) 
      {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (pcRef.current) 
      {
        try 
        {
          pcRef.current.ontrack = null;
        } 
        catch(error)
        {
          console.log("Error while removing tracks: ",error)
        }
        try 
        {
          pcRef.current.onicecandidate = null;
        }
        catch(error)
        {
          console.log("Error while removing ice candidates: ",error)
        }
        try 
        {
          pcRef.current.close();
        } 
        catch(error)
        {
          console.log("Error while closing peer connection: ",error)
        }
        pcRef.current = null;
      }
      iceQueueRef.current = {};
      socket.off("offer");
      socket.off("answer");
      socket.off("ice");
      socket.off("end call");
      if (localVideoRef.current) 
      {
        localVideoRef.current.srcObject = null
      }
      if (remoteVideoRef.current)
      {
        remoteVideoRef.current.srcObject = null;
      }  
    } 
    catch (error) 
    {
      console.log("cleanup error: ", error);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try 
      {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) 
        {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        localStreamRef.current = stream;

        if (localVideoRef.current) 
        {
          localVideoRef.current.muted = true;
          localVideoRef.current.srcObject = stream;
          try 
          {
            await localVideoRef.current.play();
          } 
          catch (error)
          {
           console.log("AUTOPLAY blocked: ", error)
          }
        }

        const pc = createPeerConnection();
        attachLocalTracks(pc, stream);

        receiveOffer(async ({ offer, sender }) => {
          try {
            const pc2 = createPeerConnection()
            await pc2.setRemoteDescription(new RTCSessionDescription(offer))

            const answer = await pc2.createAnswer()
            await pc2.setLocalDescription(answer)

            sendAnswer(answer, currentUser, sender)
            await flushIceQueue();
          } 
          catch (error) 
          {
            console.log("receiveOffer error", error);
          }
        })

        receiveAnswer(async ({ answer }) => {
          try 
          {
            const pc2 = createPeerConnection()
            await pc2.setRemoteDescription(new RTCSessionDescription(answer))
            await flushIceQueue();
          } 
          catch (error) 
          {
            console.log("receiveAnswer error", error);
          }
        });

        receiveIce(selectedUser, async (candidate) => {
          try 
          {
            await addIceSafely(candidate);
          } 
          catch (error) 
          {
            console.log("receiveIce addIceSafely error", error);
          }
        });

        socket.on("end call", (data) => {
          cleanupCall();
          if (onClose) 
          {
            onClose()
          }
        });
        socket.on("reject call", (data) =>
        {
          cleanupCall();
          if (onClose)
          {
            onClose();
          }
        });
        if (isCaller) 
        {
         try 
         {
           await new Promise((resolve) => setTimeout(resolve, 500));
           const offerPc = createPeerConnection()
           attachLocalTracks(offerPc, stream)
           const offer = await offerPc.createOffer()
           await offerPc.setLocalDescription(offer)
           sendOffer(offer, currentUser, selectedUser)
         } 
         catch (error) 
         {
          console.log("Error while creating offer and setting local description: ",error)
         }
        }
        const start = Date.now();
        const interval = setInterval(() => {
          if (!mounted) 
          {
            return
          }
            
          if (localStreamRef.current && localVideoRef.current && !localVideoRef.current.srcObject) 
          {
            localVideoRef.current.srcObject = localStreamRef.current;
            try 
            {
              localVideoRef.current.play().catch(() => {});
            } 
            catch (error)
            {
              console.log("Error while playing the streams: ", error);
            }
          }
          if (Date.now() - start > 6000) 
          {
            clearInterval(interval);
          }
        }, 1000)

        setLoading(false);
        startTimer()
      } 
      catch (error) 
      {
        console.log("initialisation error", error);
        setLoading(false);
      }
    };
    init();

    return () => {
      mounted = false
      cleanupCall()
    };
  }, [])

  const handleHangup = () => {
    try 
    {
      sendEndCall(currentUser, selectedUser)
    } 
    catch (error) 
    {
      console.log("sendEndCall error", error);
    }
    cleanupCall();
    if (onClose) 
    {
      onClose()
    }
  };

  const toggleMute = () => {
    if (!localStreamRef.current) 
    {
      console.log("Error no local stream found")
      return
    }
    const track = localStreamRef.current.getAudioTracks()[0]
    if (!track)
    {
      console.log("Error no audio stream found")
      return
    } 
    track.enabled = !track.enabled
    setIsMuted(!track.enabled)
  }

  const toggleVideo = () => 
  {
    if (!localStreamRef.current) 
    {
      console.log("Error, no local stream found")
      return
    }
    const track = localStreamRef.current.getVideoTracks()[0]
    if (!track)
    {
      console.log("Error, no video stream found")
      return
    }
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
  }

  const switchCamera = async () => {
    try 
    {
      if (!localStreamRef.current) 
      {
        return
      }

      const currentVideoTrack = localStreamRef.current.getVideoTracks()[0]
      if (currentVideoTrack) 
      {
        currentVideoTrack.stop()
      }

      const newCamera = currentCamera === 'user' ? 'environment' : 'user';
      
      const newVideoConstraints = {
        facingMode: newCamera,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: newVideoConstraints,
        audio: true 
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const audioTrack = localStreamRef.current.getAudioTracks()[0];

      const combinedStream = new MediaStream([newVideoTrack, audioTrack]);
      localStreamRef.current = combinedStream;

      if (localVideoRef.current) 
      {
        localVideoRef.current.srcObject = combinedStream;
      }

      const pc = pcRef.current
      if (pc) 
      {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) 
        {
          await sender.replaceTrack(newVideoTrack)
        }
      }

      setCurrentCamera(newCamera)

    } 
    catch (error) 
    {
      console.error('Camera switch failed:', error)
      try 
      {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        const newVideoTrack = fallbackStream.getVideoTracks()[0];
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        const combinedStream = new MediaStream([newVideoTrack, audioTrack]);
        
        localStreamRef.current = combinedStream;
        if (localVideoRef.current) 
        {
          localVideoRef.current.srcObject = combinedStream;
        }
        
        const pc = pcRef.current;
        if (pc) 
        {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) 
          {
            await sender.replaceTrack(newVideoTrack);
          }
        }
      } 
      catch (fallbackError) 
      {
        console.error('Fallback camera switch also failed:', fallbackError);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      {loading && <LoadingScreen message="Initializing call..." />}
      {!loading && (
        <>
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
            Call duration: {formatDuration(callDuration)}
          </div>
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
              className={`w-12 h-12 rounded-full ${
                isMuted ? "bg-red-600" : "bg-gray-800"
              } hover:bg-gray-700 flex items-center justify-center shadow-md`}
            >
              {isMuted ? (
                <FaMicrophoneSlash className="text-white text-xl" />
              ) : (
                <FaMicrophone className="text-white text-xl" />
              )}
            </button>
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full ${
                isVideoOff ? "bg-red-600" : "bg-gray-800"
              } hover:bg-gray-700 flex items-center justify-center shadow-md`}
            >
              {isVideoOff ? (
                <FaVideoSlash className="text-white text-xl" />
              ) : (
                <FaVideo className="text-white text-xl" />
              )}
            </button>
            <button 
              onClick={switchCamera}
              className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center shadow-md"
            >
              <FaSync className="text-white text-xl" />
            </button>
            <button
              onClick={handleHangup}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg"
            >
              <FaPhoneSlash className="text-white text-2xl" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoCall
