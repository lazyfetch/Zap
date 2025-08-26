import dotenv from "dotenv"
dotenv.config()

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Message } from "./src/models/message.model.js";


const app = express();
const server = createServer(app);
console.log(process.env.CORS_ORIGIN)
const io = new Server(server,{
  cors:{
    origin:process.env.CORS_ORIGIN,
    methods:["GET","POST"],
    credentials:true
  }
});
console.log(process.env.CORS_ORIGIN)
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN);
  next();
});



io.on('connection', (socket) => {
  socket.on('join room', (userId) => {
    socket.join(userId);
  })
  socket.on('typing', ({sender,receiver}) => {
    io.to(receiver).emit('typing',{sender,receiver})
  })

  socket.on('stop typing', ({ sender, receiver }) => {
    io.to(receiver).emit('stop typing', { sender });
  })

  socket.on('read', ({ sender, receiver }) => {
    io.to(receiver).emit('read', { sender });
  })

  socket.on('offer',({offer,receiver})=>{
    io.to(receiver).emit('offer',{offer})
  })

  socket.on('answer',({answer,receiver})=>{
    io.to(receiver).emit('answer',{answer})
  })

  socket.on('ice candidate',({candidate,receiver})=>{
    io.to(receiver).emit('ice candidate',{candidate})
  })

  socket.on('chat message', async (msgObj) => {
    io.to(msgObj.receiver).to(msgObj.sender).emit('chat message', msgObj);

    const savedMsg = await Message.create({
      content: msgObj.message,
      sender: msgObj.sender,
      receiver: msgObj.receiver,
      status: "sent",
      tempId: msgObj.tempId
    });

    const savedMsgObject = savedMsg.toObject ? savedMsg.toObject() : savedMsg;
    
    setTimeout(() => {
      io.to(msgObj.receiver).to(msgObj.sender).emit('db saved', savedMsgObject);
    }, 1000);
  });
})


import authRouter from "./src/routes/auth.routes.js";
import userRouter from "./src/routes/user.routes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);

app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    details: err.details || null
  });
});

export { app , server};