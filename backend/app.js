import dotenv from "dotenv"
dotenv.config()

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Message } from "./src/models/message.model.js";
import passport from "./src/middleware/passport.js";

const USE_COOKIES = process.env.USE_COOKIES === "true";

const app = express();
const server = createServer(app);
const io = new Server(server,{
  cors:{
    origin:process.env.CORS_ORIGIN,
    methods:["GET","POST"],
    credentials:true
  }
});
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: USE_COOKIES,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 
  }
}))

app.use(passport.initialize())
app.use(passport.session())

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
    io.to(receiver).emit('stop typing', { sender,receiver});
  })

  socket.on('start call', ({ sender, receiver }) => {
    io.to(receiver._id).emit('start call', { sender })
  })

  socket.on('offer', ({ offer, sender, receiver }) => {
    io.to(receiver._id).emit('offer', { offer, sender })
  })

  socket.on('answer', ({ answer, sender, receiver }) => {
    io.to(receiver._id).emit('answer', { answer, sender })
  })

  socket.on('ice', ({ candidate, sender, receiver }) => {
    io.to(receiver._id).emit('ice', { candidate, sender });
  });

  socket.on('end call', ({ sender, receiver }) => {
    io.to(receiver._id).emit('end call', { sender });
  });

  socket.on('reject call', ({ sender, receiver }) => {
    io.to(receiver._id).emit('reject call', { sender });
  });

  socket.on('delete',({msgObj,receiver})=>{
    io.to(receiver._id).emit('delete',msgObj)
  })
  socket.on('delete group message', ({ msgObj, group}) => {
    io.to(group._id).emit('delete group message', msgObj);
  });

  socket.on('read', ({ sender, receiver, messageIds }) => {
    io.to(receiver).emit('read', { sender, messageIds })
  })
  

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

  socket.on('read group message', ({ sender, groupId, messageIds }) => {
    io.to(groupId).emit('read group message', { sender, messageIds })
  })
  socket.on('user online', ({ userId }) => {
    io.emit('user online', { userId })
  })
  
  socket.on('user offline', ({ userId, lastSeen }) => {
    io.emit('user offline', { userId, lastSeen })
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