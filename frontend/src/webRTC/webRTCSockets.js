import socket from "../socket"

const StartCall = (sender, receiver) => {
  socket.emit('start call', { sender, receiver })
}

const ReceiveCall = (callback) => {
  socket.off('start call')
  socket.on('start call', (data) => {
    callback(data)
  })
}

const sendOffer = (offer, sender, receiver) => {
  socket.emit('offer', { offer, sender, receiver })
}

const receiveOffer = (callback) => {
  socket.off('offer')
  socket.on('offer', (data) => {
    callback(data)
  })
}

const sendAnswer = (answer, sender, receiver) => {
  socket.emit('answer', { answer, sender, receiver })
}

const receiveAnswer = (callback) => {
  socket.off('answer')
  socket.on('answer', (data) => {
    callback(data)
  })
}

const iceQueueMap = {};

const sendIce = (candidate, sender, receiver) => {
  socket.emit('ice', { candidate, sender, receiver })
}

const receiveIce = (pcId, addIceCallback) => {
  socket.off('ice')
  socket.on('ice', async ({ candidate, sender, receiver }) => {
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
    } 
    catch (error) 
    {
      console.log("Socket: Remote description not set, queueing ICE.", error)
      iceQueueMap[pcId].push(candidate)
    }
  });
};

const sendEndCall = (sender, receiver) => {
  socket.emit('end call', { sender, receiver })
};

const receiveEndCall = (callback) => {
  socket.off('end call');
  socket.on('end call', (data) => {
    callback(data)
  });
};

const sendRejectCall = (sender, receiver) => {
  socket.emit('reject call', { sender, receiver })
}

const receiveRejectCall = (callback) => {
  socket.off('reject call')
  socket.on('reject call', (data) => {
    callback(data)
  })
}

const sendAcceptCall = (sender, receiver) => {
  socket.emit("accept call", { sender, receiver })
}

const receiveAcceptCall = (callback) => {
  socket.off("accept call")
  socket.on("accept call", (data) => {
    callback(data)
  })
}

export {ReceiveCall, StartCall, sendOffer, receiveOffer, sendAnswer, receiveAnswer, sendIce, receiveIce, sendEndCall, receiveEndCall, sendRejectCall, receiveRejectCall, sendAcceptCall, receiveAcceptCall }