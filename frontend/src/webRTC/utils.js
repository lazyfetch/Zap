import socket from "../socket.js";
import { getPeerConnection } from "./peerConnectionStore.js";
import { createSDPOffer, getLocalStream } from "./webrtcClient.js";

const sendPeerConnection = async (receiverUserId) => {
  const peerConnection = getPeerConnection()
  const offer = await createSDPOffer(peerConnection)
  socket.emit('offer', {offer:offer,receiver:receiverUserId})
};

const receiveSDPOffer=(receiverUserId)=>{
    socket.off('offer');
    socket.on('offer',async (offer)=>{
        const peerConnection= new RTCPeerConnection()
        await peerConnection.setRemoteDescription(offer.offer)
        const stream=await getLocalStream()
        for (const track of stream.getTracks()) 
        {
          peerConnection.addTrack(track)
        }

        const answer= await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        socket.emit('answer',{answer,receiver:receiverUserId})
    })
}




export { sendPeerConnection,receiveSDPOffer }