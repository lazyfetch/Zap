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

export { verifyLogin }