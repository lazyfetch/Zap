import socket from "../socket"

const StartCall = (sender, receiver) => {
  socket.emit('start call', { sender, receiver })
  console.log(`Socket: Start call event sent from ${sender} to ${receiver}`)
}

const ReceiveCall = (callback) => {
  socket.off('start call')
  socket.on('start call', (data) => {
    console.log("Socket: Start call event received", data)
    callback(data)
  })
}

const sendOffer = (offer, sender, receiver) => {
  console.log(`Socket: Sending offer from ${sender} to ${receiver}`)
  socket.emit('offer', { offer, sender, receiver })
}

const receiveOffer = (callback) => {
  socket.off('offer')
  socket.on('offer', (data) => {
    console.log("Socket: Offer received", data)
    callback(data)
  })
}

const sendAnswer = (answer, sender, receiver) => {
  console.log(`Socket: Sending answer from ${sender} to ${receiver}`)
  socket.emit('answer', { answer, sender, receiver })
}

const receiveAnswer = (callback) => {
  socket.off('answer')
  socket.on('answer', (data) => {
    console.log("Socket: Answer received", data)
    callback(data)
  })
}

const iceQueueMap = {};

const sendIce = (candidate, sender, receiver) => {
  console.log(`Socket: Sending ICE candidate from ${sender} to ${receiver}`)
  socket.emit('ice', { candidate, sender, receiver })
}

const receiveIce = (pcId, addIceCallback) => {
  socket.off('ice')
  socket.on('ice', async ({ candidate, sender, receiver }) => {
    console.log("Socket: ICE candidate received.", candidate);
    if (!iceQueueMap[pcId]) 
    {
      iceQueueMap[pcId] = []
    }
    if (!addIceCallback) 
    {
       return
    }
    try 
    {
      await addIceCallback(candidate);
      console.log("Socket: ICE received and added immediately.")
    } 
    catch (error) 
    {
      console.log("Socket: Remote description not set, queueing ICE.", error)
      iceQueueMap[pcId].push(candidate)
    }
  });
};

const sendEndCall = (sender, receiver) => {
  console.log(`Socket: End call sent from ${sender} to ${receiver}`)
  socket.emit('end call', { sender, receiver })
};

const receiveEndCall = (callback) => {
  socket.off('end call');
  socket.on('end call', (data) => {
    console.log("Socket: End call received")
    callback(data)
  });
};

const sendRejectCall = (sender, receiver) => {
  console.log(`Socket: Reject call sent from ${sender} to ${receiver}`)
  socket.emit('reject call', { sender, receiver })
}

const receiveRejectCall = (callback) => {
  socket.off('reject call')
  socket.on('reject call', (data) => {
    console.log("Socket: Reject call received")
    callback(data)
  })
}

const sendAcceptCall = (sender, receiver) => {
  console.log(`Socket: Accept call sent from ${sender} to ${receiver}`)
  socket.emit("accept call", { sender, receiver })
}

const receiveAcceptCall = (callback) => {
  socket.off("accept call")
  socket.on("accept call", (data) => {
    console.log("Socket: Accept call received", data)
    callback(data)
  })
}

export {ReceiveCall, StartCall, sendOffer, receiveOffer, sendAnswer, receiveAnswer, sendIce, receiveIce, sendEndCall, receiveEndCall, sendRejectCall, receiveRejectCall, sendAcceptCall, receiveAcceptCall }