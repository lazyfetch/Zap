import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import jwt from "jsonwebtoken";

const USE_COOKIES = process.env.USE_COOKIES === "true";

const verifyLogin = async(req, res, next) => {
  try {
    let accessToken;
    if (USE_COOKIES) 
    {
      accessToken = req.cookies?.accessToken;
    }
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.split(' ')[1];
      }
    }
    
    if (!accessToken) {
      return next(new ApiError(401, "No access token found"))
    }
    
    const decodedUser = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedUser._id).select("-password -refreshToken");
    
    if (!user) {
      return next(new ApiError(401, "User not logged in"));
    }

    if (user.isGuest && user.guestExpiresAt && user.guestExpiresAt < new Date()) {
      await User.deleteOne({ _id: user._id, isGuest: true });
      return next(new ApiError(401, "Guest session expired"));
    }
    
    req.user = user;
    next();
  } catch (error) 
  {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Invalid or expired token"));
    }
    if (error instanceof ApiError) 
    {
      return next(error)
    }
    return next(new ApiError(500, error.message || "Server error"));
  }
}

const requireNonGuest = (req, res, next) => {
  if (req.user?.isGuest) {
    return next(new ApiError(403, "Guest users cannot access this endpoint"));
  }
  return next();
}

export { verifyLogin, requireNonGuest }