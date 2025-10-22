import { Router } from "express";
import { requireNonGuest, verifyLogin } from "../middleware/auth.middleware.js"
import { LoginCheck, UsersList, updatePresence, getPresence, deleteAccount, changeUsername, changePassword, changeAvatar, clearChat} from "../controllers/user.controllers.js";
import { deleteMessage, fetchMessages, markMessagesAsRead } from "../controllers/message.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const userRouter = Router()

userRouter.route("/me").get(verifyLogin, LoginCheck)
userRouter.route("/list").post(verifyLogin, requireNonGuest, UsersList)
userRouter.route("/messages").post(verifyLogin, requireNonGuest, fetchMessages)
userRouter.route("/delete-message").delete(verifyLogin, requireNonGuest, deleteMessage)
userRouter.route("/read-messages").post(verifyLogin, requireNonGuest, markMessagesAsRead)
userRouter.route("/presence").post(verifyLogin, requireNonGuest, updatePresence)
userRouter.route("/presence/:userId").get(verifyLogin, requireNonGuest, getPresence)
userRouter.route("/delete").delete(verifyLogin, deleteAccount)
userRouter.route("/change-username").patch(verifyLogin, requireNonGuest, changeUsername)
userRouter.route("/change-password").patch(verifyLogin, requireNonGuest, changePassword)
userRouter.route("/clear-chat").delete(verifyLogin, requireNonGuest, clearChat)
userRouter.route("/avatar").post(verifyLogin, requireNonGuest, upload.single("avatar"), changeAvatar)


export default userRouter