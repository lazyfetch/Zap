import { io } from "socket.io-client"
import config from './config.js';

const socket = io(config.SOCKET_URL, {
  transports: ['websocket', 'polling']
});

export default socket;