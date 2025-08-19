import { Router } from "express";
import { verifyLogin } from "../middleware/auth.middleware.js"
import { LoginCheck } from "../controllers/user.controllers.js";

const userRouter=Router()

userRouter.route("/me").get(verifyLogin, LoginCheck)

export default userRouter