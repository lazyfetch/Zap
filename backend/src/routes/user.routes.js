import { Router } from "express";
import { verifyLogin } from "../middleware/auth.middleware.js"
import { LoginCheck,UsersList } from "../controllers/user.controllers.js";
import { deleteMessage, fetchMessages, markMessagesAsRead } from "../controllers/message.controller.js";

const userRouter=Router()

userRouter.route("/me").get(verifyLogin, LoginCheck)
userRouter.route("/list").post(verifyLogin, UsersList)
userRouter.route("/messages").post(verifyLogin, fetchMessages)
userRouter.route("/delete-message").delete(verifyLogin, deleteMessage)
userRouter.route("/read-messages").post(verifyLogin, markMessagesAsRead)

export default userRouter