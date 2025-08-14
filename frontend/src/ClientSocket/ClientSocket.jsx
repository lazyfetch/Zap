import { io } from "socket.io-client";
const socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL;

const socket=io(socketServerUrl)

const ClientSocket=(value)=>{
    socket.emit('chat message', value);
    value=""
}   
export {ClientSocket}
