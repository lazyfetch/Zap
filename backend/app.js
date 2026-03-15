import dotenv from "dotenv"
dotenv.config()

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Message } from "./src/models/message.model.js";
import { Group } from "./src/models/group.model.js";
import { User } from "./src/models/user.model.js";
import passport from "./src/middleware/passport.js";
import { cleanupExpiredGuestRooms, markGuestRoomActive } from "./src/utils/guestRoom.utils.js";

const USE_COOKIES = process.env.USE_COOKIES === "true";

const parseAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGIN || "";
  const fromEnv = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const defaults = ["http://localhost:5173", "http://127.0.0.1:5173"];
  return [...new Set([...fromEnv, ...defaults])];
};

const allowedOrigins = parseAllowedOrigins();

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }
  return allowedOrigins.includes(origin);
};

const corsOriginHandler = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error("Not allowed by CORS"));
};

const app = express();
const server = createServer(app);
const io = new Server(server,{
  cors:{
    origin:corsOriginHandler,
    methods:["GET","POST"],
    credentials:true
  }
});
app.use(cors({
  origin: corsOriginHandler,
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
  next();
});

setInterval(async () => {
  try {
    await cleanupExpiredGuestRooms();
  } catch (error) {
    console.error("Guest room cleanup failed:", error?.message || error);
  }
}, 5 * 60 * 1000);



io.on('connection', (socket) => {
  const resolveUserId = (userLike) => {
    if (!userLike) {
      return null;
    }
    if (typeof userLike === "string") {
      return userLike;
    }
    return userLike._id || null;
  }

  const getUserContext = async (userLike) => {
    const userId = resolveUserId(userLike);
    if (!userId) {
      return null;
    }
    return User.findById(userId).select("_id username isGuest guestRoom");
  }

  const canGuestReachPeer = async (senderLike, receiverLike) => {
    const sender = await getUserContext(senderLike);
    const receiver = await getUserContext(receiverLike);

    if (!sender || !receiver || !sender.isGuest || !receiver.isGuest) {
      return null;
    }

    const senderRoom = sender.guestRoom ? sender.guestRoom.toString() : "";
    const receiverRoom = receiver.guestRoom ? receiver.guestRoom.toString() : "";
    if (!senderRoom || senderRoom !== receiverRoom) {
      return null;
    }

    const room = await Group.findById(senderRoom).select("_id isGuestRoom members guestMaxMembers");
    if (!room || !room.isGuestRoom) {
      return null;
    }

    const memberIds = (room.members || []).map((id) => id.toString());
    if (!memberIds.includes(sender._id.toString()) || !memberIds.includes(receiver._id.toString())) {
      return null;
    }

    if (memberIds.length > (room.guestMaxMembers || 2)) {
      return null;
    }

    return { sender, receiver, room };
  }

  socket.on('join room', (userId) => {
    socket.join(userId);
  })

  socket.on('typing', ({sender,receiver}) => {
    getUserContext(sender).then((senderUser) => {
      if (senderUser?.isGuest) {
        return;
      }
      io.to(receiver).emit('typing',{sender,receiver})
    })
  })

  socket.on('stop typing', ({ sender, receiver }) => {
    getUserContext(sender).then((senderUser) => {
      if (senderUser?.isGuest) {
        return;
      }
      io.to(receiver).emit('stop typing', { sender,receiver});
    })
  })

  socket.on('start call', async ({ sender, receiver }) => {
    const senderUser = await getUserContext(sender);
    const receiverId = resolveUserId(receiver);
    if (!senderUser || !receiverId) {
      return;
    }

    if (senderUser.isGuest) {
      const relation = await canGuestReachPeer(senderUser._id, receiverId);
      if (!relation) {
        return;
      }
      await markGuestRoomActive(relation.room._id);
      io.to(receiverId).emit('start call', { sender })
      return;
    }

    io.to(receiverId).emit('start call', { sender })
  })

  socket.on('offer', async ({ offer, sender, receiver }) => {
    const senderUser = await getUserContext(sender);
    const receiverId = resolveUserId(receiver);
    if (!senderUser || !receiverId) {
      return;
    }

    if (senderUser.isGuest) {
      const relation = await canGuestReachPeer(senderUser._id, receiverId);
      if (!relation) {
        return;
      }
      await markGuestRoomActive(relation.room._id);
      io.to(receiverId).emit('offer', { offer, sender })
      return;
    }

    io.to(receiverId).emit('offer', { offer, sender })
  })

  socket.on('answer', async ({ answer, sender, receiver }) => {
    const senderUser = await getUserContext(sender);
    const receiverId = resolveUserId(receiver);
    if (!senderUser || !receiverId) {
      return;
    }

    if (senderUser.isGuest) {
      const relation = await canGuestReachPeer(senderUser._id, receiverId);
      if (!relation) {
        return;
      }
      await markGuestRoomActive(relation.room._id);
      io.to(receiverId).emit('answer', { answer, sender })
      return;
    }

    io.to(receiverId).emit('answer', { answer, sender })
  })

  socket.on('ice', async ({ candidate, sender, receiver }) => {
    const senderUser = await getUserContext(sender);
    const receiverId = resolveUserId(receiver);
    if (!senderUser || !receiverId) {
      return;
    }

    if (senderUser.isGuest) {
      const relation = await canGuestReachPeer(senderUser._id, receiverId);
      if (!relation) {
        return;
      }
      await markGuestRoomActive(relation.room._id);
      io.to(receiverId).emit('ice', { candidate, sender });
      return;
    }

    io.to(receiverId).emit('ice', { candidate, sender });
  });

  socket.on('end call', async ({ sender, receiver }) => {
    const senderUser = await getUserContext(sender);
    const receiverId = resolveUserId(receiver);
    if (!senderUser || !receiverId) {
      return;
    }

    if (senderUser.isGuest) {
      const relation = await canGuestReachPeer(senderUser._id, receiverId);
      if (!relation) {
        return;
      }
      await markGuestRoomActive(relation.room._id);
      io.to(receiverId).emit('end call', { sender });
      return;
    }

    io.to(receiverId).emit('end call', { sender });
  });

  socket.on('reject call', async ({ sender, receiver }) => {
    const senderUser = await getUserContext(sender);
    const receiverId = resolveUserId(receiver);
    if (!senderUser || !receiverId) {
      return;
    }

    if (senderUser.isGuest) {
      const relation = await canGuestReachPeer(senderUser._id, receiverId);
      if (!relation) {
        return;
      }
      await markGuestRoomActive(relation.room._id);
      io.to(receiverId).emit('reject call', { sender });
      return;
    }

    io.to(receiverId).emit('reject call', { sender });
  });

  socket.on('accept call', async ({ sender, receiver }) => {
    const senderUser = await getUserContext(sender);
    const receiverId = resolveUserId(receiver);
    if (!senderUser || !receiverId) {
      return;
    }

    if (senderUser.isGuest) {
      const relation = await canGuestReachPeer(senderUser._id, receiverId);
      if (!relation) {
        return;
      }
      await markGuestRoomActive(relation.room._id);
      io.to(receiverId).emit('accept call', { sender });
      return;
    }

    io.to(receiverId).emit('accept call', { sender });
  });

  socket.on('delete',({msgObj,receiver})=>{
    getUserContext(msgObj?.sender).then((senderUser) => {
      if (senderUser?.isGuest) {
        return;
      }
      io.to(receiver._id).emit('delete',msgObj)
    })
  })

  socket.on('delete group message', ({ msgObj, group}) => {
    io.to(group._id).emit('delete group message', msgObj);
  });

  socket.on('read', ({ sender, receiver, messageIds }) => {
    getUserContext(sender).then((senderUser) => {
      if (senderUser?.isGuest) {
        return;
      }
      io.to(receiver).emit('read', { sender, messageIds })
    })
  })

  socket.on('chat message', async (msgObj) => {
    const senderUser = await User.findById(msgObj.sender).select("_id isGuest");
    if (!senderUser || senderUser.isGuest) {
      return;
    }

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
    const group = await Group.findById(msgObj.groupId).select("_id isGuestRoom members guestMaxMembers");
    if (!group) {
      return;
    }

    const sender = await User.findById(msgObj.sender).select("_id username isGuest guestRoom");
    if (!sender) {
      return;
    }

    const isMember = (group.members || []).some((memberId) => memberId.toString() === sender._id.toString());
    if (!isMember) {
      return;
    }

    if (group.isGuestRoom) {
      const senderGuestRoom = sender.guestRoom ? sender.guestRoom.toString() : "";
      if (!sender.isGuest || senderGuestRoom !== group._id.toString()) {
        return;
      }

      await markGuestRoomActive(group._id);
      io.to(msgObj.groupId).emit('group message', {
        ...msgObj,
        senderName: sender.username,
        status: "sent"
      });
      return;
    }

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

  socket.on('group typing', async ({ groupId, sender }) => {
    const senderUser = await getUserContext(sender);
    if (!senderUser || !groupId) {
      return;
    }

    const group = await Group.findById(groupId).select("_id isGuestRoom members");
    if (!group) {
      return;
    }

    const memberIds = (group.members || []).map((id) => id.toString());
    if (!memberIds.includes(senderUser._id.toString())) {
      return;
    }

    if (group.isGuestRoom) {
      const senderRoom = senderUser.guestRoom ? senderUser.guestRoom.toString() : "";
      if (!senderUser.isGuest || senderRoom !== group._id.toString()) {
        return;
      }
      await markGuestRoomActive(group._id);
    }

    socket.to(groupId).emit('group typing', {
      groupId,
      sender: senderUser._id.toString(),
      senderName: senderUser.username,
    })
  })

  socket.on('group stop typing', async ({ groupId, sender }) => {
    const senderUser = await getUserContext(sender);
    if (!senderUser || !groupId) {
      return;
    }

    const group = await Group.findById(groupId).select("_id isGuestRoom members");
    if (!group) {
      return;
    }

    const memberIds = (group.members || []).map((id) => id.toString());
    if (!memberIds.includes(senderUser._id.toString())) {
      return;
    }

    if (group.isGuestRoom) {
      const senderRoom = senderUser.guestRoom ? senderUser.guestRoom.toString() : "";
      if (!senderUser.isGuest || senderRoom !== group._id.toString()) {
        return;
      }
      await markGuestRoomActive(group._id);
    }

    socket.to(groupId).emit('group stop typing', {
      groupId,
      sender: senderUser._id.toString(),
      senderName: senderUser.username,
    })
  })

  socket.on('guest message delivered', async ({ groupId, tempId, messageSender, deliveredBy }) => {
    if (!groupId || !tempId || !messageSender || !deliveredBy) {
      return;
    }

    const relation = await canGuestReachPeer(deliveredBy, messageSender);
    if (!relation || relation.room._id.toString() !== groupId) {
      return;
    }

    await markGuestRoomActive(relation.room._id);

    io.to(resolveUserId(messageSender)).emit('guest message delivered', {
      groupId,
      tempId,
      deliveredBy: resolveUserId(deliveredBy),
    })
  })

  socket.on('guest message read', async ({ groupId, tempIds, messageSender, readBy }) => {
    if (!groupId || !Array.isArray(tempIds) || tempIds.length === 0 || !messageSender || !readBy) {
      return;
    }

    const relation = await canGuestReachPeer(readBy, messageSender);
    if (!relation || relation.room._id.toString() !== groupId) {
      return;
    }

    await markGuestRoomActive(relation.room._id);

    io.to(resolveUserId(messageSender)).emit('guest message read', {
      groupId,
      tempIds,
      readBy: resolveUserId(readBy),
    })
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

app.get('/health', (req, res) => {
  res.status(200).send('Server is awake and healthy!');
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/group", groupRouter);
app.use("/api/v1/file", fileRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error("ERROR:", err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    details: err.details || null
  });
});



export { app , server};