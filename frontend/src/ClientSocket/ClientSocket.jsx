import { io } from "socket.io-client";
const socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL;

const socket=io(socketServerUrl)

const JoinRoom = (userId) => {
    socket.emit('join room', userId);
};

const ClientSocket = (value, senderUserId,receiverUserId,tempId) => {
    socket.emit('chat message', {
        message:value,
        sender:senderUserId,
        receiver:receiverUserId,
        tempId:tempId
    });
}       

const EmitMessage=(callback)=>{
    socket.off('chat message');
    socket.on('chat message', (msg) => {
        callback(msg)
  });
}

const ChangeStatus=(callback)=>{
    console.log("Setting up db saved listener");
    socket.off('db saved');
    socket.on('db saved',(msg)=>{
        callback(msg)
    })
}

const TypingStarted = (senderUserId, receiverUserId) => {
    socket.emit('typing', { sender: senderUserId, receiver: receiverUserId });
    console.log("1st part done")
}

const TypingIndicator = (callback) => {
    socket.off('typing')
    socket.on('typing', (data) => {
        callback(data)
    })
}

const TypingStopped = (senderUserId, receiverUserId) => {
    socket.emit('stop typing', { sender: senderUserId, receiver: receiverUserId });
    console.log("2nd part done")
}

const StopTypingIndicator = (callback) => {
    socket.off('stop typing')
    socket.on('stop typing', (data) => {
        callback(data)
    })
}



export {ClientSocket,EmitMessage,JoinRoom,ChangeStatus,TypingStarted,TypingIndicator,TypingStopped,StopTypingIndicator}
