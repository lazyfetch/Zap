import dotenv from "dotenv"
dotenv.config()

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Message } from "./src/models/message.model.js";
const USE_COOKIES = process.env.USE_COOKIES === "true";

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
  credentials: USE_COOKIES, // only true if using cookies
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

  socket.on('start call', ({ sender, receiver }) => {
    io.to(receiver._id).emit('start call', { sender })
    console.log("Data transmitted")
  })

  socket.on('offer', ({ offer, sender, receiver }) => {
    io.to(receiver._id).emit('offer', { offer, sender })
    console.log("Offer relayed")
  })

  socket.on('answer', ({ answer, sender, receiver }) => {
    io.to(receiver._id).emit('answer', { answer, sender })
    console.log("Answer relayed")
  })

  socket.on('ice', ({ candidate, sender, receiver }) => {
    io.to(receiver._id).emit('ice', { candidate, sender });
    console.log("ICE relayed");
  });

  socket.on('end call', ({ sender, receiver }) => {
    io.to(receiver._id).emit('end call', { sender });
    console.log("End call relayed");
  });

  socket.on('reject call', ({ sender, receiver }) => {
    io.to(receiver._id).emit('reject call', { sender });
    console.log("Reject call relayed");
  });

  socket.on('delete',({msgObj,receiver})=>{
    io.to(receiver._id).emit('delete',msgObj)
  })
  socket.on('delete group message', ({ msgObj, group}) => {
    io.to(group._id).emit('delete group message', msgObj);
  });
  

  socket.on('chat message', async (msgObj) => {
    io.to(msgObj.receiver).to(msgObj.sender).emit('chat message', msgObj);

    let content = "File attachment"; 
    
    if (msgObj.message && msgObj.message.trim() !== "") 
    {
      content = msgObj.message
    } 
    else if (msgObj.fileData && msgObj.fileData.data && msgObj.fileData.data.originalName) 
    {
      content = msgObj.fileData.data.originalName
    }

    const messageData = {
      content: content, 
      sender: msgObj.sender,
      receiver: msgObj.receiver,
      status: "sent",
      tempId: msgObj.tempId
    };

    if (msgObj.fileData && msgObj.fileData.data) 
    {
      messageData.mediaUrl = msgObj.fileData.data.url
      messageData.mediaType = "file";
      messageData.fileSize = msgObj.fileData.data.size
    }

    const savedMsg = await Message.create(messageData)
    const savedMsgObject = savedMsg.toObject ? savedMsg.toObject() : savedMsg
    
    setTimeout(() => {
      io.to(msgObj.receiver).to(msgObj.sender).emit('db saved', savedMsgObject);
    }, 1000);
  })

  socket.on('join group room', (groupId) => {
    socket.join(groupId)
  })

  socket.on('group message', async (msgObj) => {
    io.to(msgObj.groupId).emit('group message', msgObj);
    
    let content = "File attachment"

    if (msgObj.message && msgObj.message.trim() !== "") 
    {
      content = msgObj.message
    } 
    else if (msgObj.fileData && msgObj.fileData.data && msgObj.fileData.data.originalName) 
    {
      content = msgObj.fileData.data.originalName
    }

    const messageData = {
      content: content,
      sender: msgObj.sender,
      roomId: msgObj.groupId,
      status: "sent",
      tempId: msgObj.tempId
    };

    if (msgObj.fileData && msgObj.fileData.data) 
    {
      messageData.mediaUrl = msgObj.fileData.data.url
      messageData.mediaType = "file";
      messageData.fileSize = msgObj.fileData.data.size
    }

    const savedMsg = await Message.create(messageData);
    const savedMsgObject = savedMsg.toObject ? savedMsg.toObject() : savedMsg;
    
    setTimeout(() => {
      io.to(msgObj.groupId).emit('db saved', savedMsgObject);
    }, 1000);
  })
})


import authRouter from "./src/routes/auth.routes.js";
import userRouter from "./src/routes/user.routes.js";
import groupRouter from "./src/routes/group.routes.js";
import fileRouter from "./src/routes/file.routes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/group", groupRouter);
app.use("/api/v1/file", fileRouter);

app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    details: err.details || null
  });
});



export { app , server};