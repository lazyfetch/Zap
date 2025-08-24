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



export {ClientSocket,EmitMessage,JoinRoom,ChangeStatus}
