import { Router } from "express";
import { loginUser, registerUser, logoutUser, refreshTokens } from "../controllers/auth.controllers.js";
import { verifyLogin } from "../middleware/auth.middleware.js";
import passport from "../middleware/passport.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const authRouter = Router();

authRouter.route("/register").post(registerUser);
authRouter.route("/login").post(loginUser);
authRouter.route("/refresh-token").get(refreshTokens);
authRouter.route("/logout").post(verifyLogin, logoutUser);

authRouter.get("/google", 
  passport.authenticate("google", { scope: ["profile", "email"] })
)

authRouter.get("/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.CORS_ORIGIN}/login?error=google_auth_failed` }),
  async (req, res) => {
    try 
    {
      const user = req.user;
      
      const isNewUser = user.username.match(/\d{3}$/)

      
      if (isNewUser) 
      {
        const redirectUrl = `${process.env.CORS_ORIGIN}/?showUsernameSelection=true&tempUserId=${user._id}&email=${encodeURIComponent(user.email)}&avatar=${encodeURIComponent(user.avatar || '')}&displayName=${encodeURIComponent(user.username)}`;
        console.log("Redirecting to username selection:", redirectUrl);
        res.redirect(redirectUrl);
        return;
      }
      const accessToken = jwt.sign(
        { _id: user._id, email: user.email, username: user.username },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
      );

      const refreshToken = jwt.sign(
        { _id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
      );

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      const redirectUrl = `${process.env.CORS_ORIGIN}/?googleLogin=true&accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }))}`;
      
      res.redirect(redirectUrl);
    } 
    catch (error) 
    {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${process.env.CORS_ORIGIN}/login?error=auth_failed`);
    }
  }
)

authRouter.post("/google/complete-signup", async (req, res) => {
  try 
  {
    const { tempUserId, username } = req.body;
    
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== tempUserId) {
      return res.status(400).json({
        success: false,
        message: "Username already taken"
      });
    }

    const user = await User.findById(tempUserId)
    if (!user) 
    {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.username = username.toLowerCase();
    await user.save();
    console.log("Username updated:", user.username);

    const accessToken = jwt.sign(
      { _id: user._id, email: user.email, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: "Signup completed successfully",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar
        },
        accessToken,
        refreshToken
      }
    });
  } 
  catch (error) 
  {
    console.error("Complete signup error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

export default authRouter