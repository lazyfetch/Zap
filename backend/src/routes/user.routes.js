import { Router } from "express";
import { verifyLogin } from "../middleware/auth.middleware.js"
import { LoginCheck, UsersList, updatePresence, getPresence, deleteAccount, changeUsername, changePassword, changeAvatar} from "../controllers/user.controllers.js";
import { deleteMessage, fetchMessages, markMessagesAsRead } from "../controllers/message.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const userRouter = Router()

userRouter.route("/me").get(verifyLogin, LoginCheck)
userRouter.route("/list").post(verifyLogin, UsersList)
userRouter.route("/messages").post(verifyLogin, fetchMessages)
userRouter.route("/delete-message").delete(verifyLogin, deleteMessage)
userRouter.route("/read-messages").post(verifyLogin, markMessagesAsRead)
userRouter.route("/presence").post(verifyLogin, updatePresence)
userRouter.route("/presence/:userId").get(verifyLogin, getPresence)
userRouter.route("/delete").delete(verifyLogin, deleteAccount)
userRouter.route("/change-username").patch(verifyLogin, changeUsername)
userRouter.route("/change-password").patch(verifyLogin, changePassword)
userRouter.route("/avatar").post(verifyLogin, upload.single("avatar"), changeAvatar)


export default userRouter