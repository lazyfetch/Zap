import { setPeerConnection } from "./peerConnectionStore.js";
const constraints = {
  audio: true,
  video: true
};

const getLocalStream=async()=>{
    try 
    {
        let stream=await navigator.mediaDevices.getUserMedia(constraints)
        return stream
    } 
    catch (error) 
    {
        console.log(error)
    }
}

const createPeerConnection = (stream)=>{
    try {
        const peerConnection= new RTCPeerConnection()
        for (const track of stream.getTracks()) 
        {
            peerConnection.addTrack(track)
        }
        setPeerConnection(peerConnection)
    } 
    catch (error) 
    {
        console.log("Error creating Peer Connection: ",error)
    }
}

const createSDPOffer = async (peerConnection) => 
{
    try 
    {
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        return offer
    } 
    catch (error) 
    {
        console.log("Error creating offer: ", error);
    }
}

export {getLocalStream,createPeerConnection,createSDPOffer}