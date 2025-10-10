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

const sendIce = (candidate, sender, receiver) => {
  socket.emit('ice', { candidate, sender, receiver })
}

const resolveUserId = (userLike) => {
  if (!userLike) {
    return null
  }
  if (typeof userLike === 'string') {
    return userLike
  }
  return userLike._id || null
}

const receiveIce = ({ selectedUser, addIceCallback }) => {
  const expectedPeerId = resolveUserId(selectedUser)
  socket.off('ice')
  socket.on('ice', async ({ candidate, sender, receiver }) => {
    const senderId = resolveUserId(sender)
    if (expectedPeerId && senderId && senderId !== expectedPeerId) {
      return
    }
    if (!addIceCallback) 
    {
       return
    }
    try 
    {
      await addIceCallback(candidate, sender, receiver)
    } 
    catch (error) 
    {
      console.log("Socket: addIceCallback failed.", error)
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