import socket from "../socket.js";
import { getPeerConnection } from "./peerConnectionStore.js";
import { createSDPOffer, getLocalStream } from "./webrtcClient.js";

const sendSDPOffer = async (receiverUserId,remoteVideoRef) => {
  const peerConnection = getPeerConnection()
  peerConnection.ontrack = (event) => {
    const remoteStream = event.streams[0];
    remoteVideoRef.current.srcObject = remoteStream;
  }
  const offer = await createSDPOffer(peerConnection)
  socket.emit('offer', { offer: offer, receiver: receiverUserId })
};

const receiveSDPOffer=(receiverUserId,remoteVideoRef)=>{
    socket.off('offer');
    socket.on('offer',async (offer)=>{
        const peerConnection= new RTCPeerConnection()
        peerConnection.ontrack = (event) => {
          const remoteStream = event.streams[0];
          remoteVideoRef.current.srcObject = remoteStream;
        };
        await peerConnection.setRemoteDescription(offer.offer)
        const stream=await getLocalStream()
        for (const track of stream.getTracks()) 
        {
          peerConnection.addTrack(track)
        }

        const answer= await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        socket.emit('answer',{answer:answer,receiver:receiverUserId})
    })
}

const receiveAnswer=()=>{
  socket.off('answer')
  socket.on('answer',async (answer)=>{
      const peerConnection=getPeerConnection()
      await peerConnection.setRemoteDescription(answer.answer)
  })
}

const sendICECandidates=(receiverUserId)=>{
  const peerConnection=getPeerConnection()
  peerConnection.onicecandidate=(event)=>{
    socket.emit('ice candidate',{candidate:event.candidate,receiver:receiverUserId})
  }
}

const receiveICECandidates=()=>{
  socket.off('ice candidate')
  socket.on('ice candidate', async({candidate})=>{
    if(!candidate)
    {
      return
    }
    const peerConnection=getPeerConnection()
    try 
    {
      await peerConnection.addIceCandidate(candidate)
    } 
    catch (error) 
    {
      console.error("Error adding received ICE candidate", error)
    }
  })
}

export { sendSDPOffer,receiveSDPOffer,receiveAnswer,sendICECandidates,receiveICECandidates }