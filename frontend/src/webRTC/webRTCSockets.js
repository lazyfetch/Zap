import socket from "../socket";

const StartCall = (sender, receiver) => {
  socket.emit('start call', { sender, receiver })
  console.log("Call socket event sent")
}

const ReceiveCall = (callback) => {
    socket.off('start call')
    socket.on('start call', (data) => {
    callback(data);
    console.log("Call socket event received")
  })
}

const sendOffer = (offer, sender, receiver) => {
  socket.emit('offer', { offer, sender, receiver })
  console.log("Offer sent")
}

const sendAnswer = (answer, sender, receiver) => {
  socket.emit('answer', { answer, sender, receiver })
  console.log("Answer sent")
}

const sendIce = (candidate, sender, receiver) => {
  socket.emit('ice', { candidate, sender, receiver });
  console.log("ICE sent");
};

const sendEndCall = (sender, receiver) => {
  socket.emit('end call', { sender, receiver });
  console.log("End call sent");
};

const sendRejectCall = (sender, receiver) => {
  socket.emit('reject call', { sender, receiver });
  console.log("Reject call sent");
};

const receiveOffer = (callback) => {
  socket.on('offer', (data) => {
    callback(data)
    console.log("Offer received")
  })
}

const receiveAnswer = (callback) => {
  socket.on('answer', (data) => {
    callback(data)
    console.log("Answer received")
  })
}

const receiveIce = (callback) => {
  socket.on('ice', (data) => {
    callback(data);
    console.log("ICE received");
  });
};

const receiveEndCall = (callback) => {
  socket.on('end call', (data) => {
    callback(data);
    console.log("End call received");
  });
};

const receiveRejectCall = (callback) => {
  socket.on('reject call', (data) => {
    callback(data);
    console.log("Reject call received");
  });
};

export { StartCall, ReceiveCall, sendOffer, receiveOffer, sendAnswer, receiveAnswer, sendIce, receiveIce, sendEndCall, receiveEndCall, sendRejectCall, receiveRejectCall };