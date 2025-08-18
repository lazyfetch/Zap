import dotenv from "dotenv"
dotenv.config()

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from 'node:http';
import { Server } from 'socket.io';


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

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());



io.on('connection', (socket) => {
    socket.on('join room', (userId) => {
      socket.join(userId);
    });
    socket.on('chat message', (msgObj) => {
      io.to(msgObj.receiver).to(msgObj.sender).emit('chat message', msgObj);
    });
    
})


import authRouter from "./src/routes/auth.routes.js";
import userRouter from "./src/routes/user.routes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/auth", userRouter);

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    details: err.details || null
  });
});

export { app , server};