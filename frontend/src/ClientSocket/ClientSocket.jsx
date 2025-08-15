import { io } from "socket.io-client";
const socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL;

const socket=io(socketServerUrl)

const JoinRoom = (userId) => {
    socket.emit('join room', userId);
};

const ClientSocket = (value, senderUserId,receiverUserId) => {
    socket.emit('chat message', {
        message:value,
        sender:senderUserId,
        receiver:receiverUserId
    });
}       

const EmitMessage=(callback)=>{
    socket.off('chat message');
    socket.on('chat message', (msg) => {
        console.log("Received on client:", msg);
        callback(msg)
  });
}

const SendMessage=()=>{

}
export {ClientSocket,EmitMessage,JoinRoom}
