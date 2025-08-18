import { Router } from "express";
import { loginUser, registerUser,logoutUser,refreshTokens } from "../controllers/auth.controllers.js";
import { verifyLogin } from "../middleware/auth.middleware.js"

const authRouter=Router()

authRouter.route("/register").post(registerUser)
authRouter.route("/login").post(loginUser)
authRouter.route("/refresh-token").get(refreshTokens)
authRouter.route("/logout").post(verifyLogin, logoutUser)

export default authRouter