import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import jwt from "jsonwebtoken";

const verifyLogin=async(req,res,next)=>
{
    try 
    {
        const accessToken = req.cookies?.accessToken
        if(!accessToken)
        {
            throw new ApiError(404,"Error finding the logged in user")
        }
    
        const decodedUser=jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
    
        const user=await User.findById(decodedUser.userId).select(" -password -refreshToken")
    
        if(!user)
        {
            throw new ApiError(401,"User not logged in")
        }
        req.user=user
        next()
    } 
    catch (error) 
    {
        next(new ApiError(400, error.message || error))
    }
}

export {verifyLogin}