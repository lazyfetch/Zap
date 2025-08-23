import { Router } from "express";
import { verifyLogin } from "../middleware/auth.middleware.js"
import { LoginCheck,UsersList } from "../controllers/user.controllers.js";

const userRouter=Router()

userRouter.route("/me").get(verifyLogin, LoginCheck)
userRouter.route("/list").post(verifyLogin, UsersList)

export default userRouter