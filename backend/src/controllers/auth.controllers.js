import bcrypt from "bcrypt";
import  ApiError  from "../utils/ApiError.js";
import ApiSuccess  from "../utils/ApiSuccess.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const options = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",  
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/"
};

const generateAccessToken = (userId) => {
    return jwt.sign({_id: userId}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
}

const generateRefreshToken = (userId) => {
    return jwt.sign({_id: userId}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
}

const USE_COOKIES = process.env.USE_COOKIES === "true";

const registerUser = async (req, res, next) => {
    try 
    {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) 
        {
            throw new ApiError(400, "All fields are required");
        }
        
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        
        if (existingUser) 
        {
            throw new ApiError(409, "User with username or email already exists");
        }
        
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        })
        
        if(!user) 
        {
            throw new ApiError(500, "Error creating the user");
        }
        
        const userObj = user.toObject()
        delete userObj.password
        
        return res.status(201).json(
            new ApiSuccess(201, "User registered successfully", userObj)
        );
    } 
    catch (error) 
    {
       return next(error)
    }
}

const loginUser=async(req,res,next)=>{
    try {
        const {username,password}=req.body
        
        if(!username || !password)
        {
            throw new ApiError(401,"Username and Password are required")
        }

        const user = await User.findOne({username})
    
        if(!user)
        {
            throw new ApiError(404,"User not found")
        }
        const isPasswordCorrect=await bcrypt.compare(password,user.password)
        if(!isPasswordCorrect)
        {
            throw new ApiError(401,"Password is incorrect")
        }

        const AccessToken = generateAccessToken(user._id)
        const RefreshToken = generateRefreshToken(user._id)
    
        if(!AccessToken || !RefreshToken)
        {
            throw new ApiError(500, "Error in creating Refresh and Access Tokens")
        }
        user.refreshToken=RefreshToken
        await user.save({validateBeforeSave:false})
        const userObj = user.toObject()
        delete userObj.password
        delete userObj.refreshToken
    
        if (USE_COOKIES) 
        {
            return res.status(200)
                .cookie("accessToken", AccessToken, options)
                .cookie("refreshToken", RefreshToken, options)
                .json(
                new ApiSuccess(
                    200,
                    "User Logged in successfully",
                    {
                    user: userObj,
                    refreshToken: RefreshToken,
                    accessToken: AccessToken
                    }
                )
                );
        } 
        else 
        {
            return res.status(200).json(
                new ApiSuccess(
                200,
                "User Logged in successfully",
                {
                    user: userObj,
                    refreshToken: RefreshToken,
                    accessToken: AccessToken
                }
                )
            );
        }
    } 
    catch (error) 
    {
        return next(error)    
    }

}

const logoutUser =async(req,res,next)=>{
    try {
        const user=req.user
        user.refreshToken=""
        await user.save({validateBeforeSave:false})

        res.clearCookie("accessToken", options);
        res.clearCookie("refreshToken", options);

        return res.status(200).json(
            new ApiSuccess(200,"User logged out")
        )
    } catch (error) {
        return next(error)
    }
}

const refreshTokens = async(req, res, next) => {
  try {
    let refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        refreshToken = authHeader.split(' ')[1];
      }
    }
    
    if (!refreshToken) {
      throw new ApiError(401, "No refresh token found");
    }
    
    const decodedUser = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if(!decodedUser)
    {
        res.clearCookie("accessToken", options);
        res.clearCookie("refreshToken", options);
        throw new ApiError(401, "Invalid request")
    }
    
    const user = await User.findById(decodedUser._id)
    if(!user)
    {
        throw new ApiError(400, "User not found")
    }

    if(user.refreshToken !== refreshToken)
    {
        res.clearCookie("accessToken", options);
        res.clearCookie("refreshToken", options);
        throw new ApiError(401, "Refresh token does not match");
    }
    
    const newRefreshToken = generateRefreshToken(user._id)
    const newAccessToken = generateAccessToken(user._id)

    if(!newRefreshToken || !newAccessToken)
    {
        throw new ApiError(500, "Error creating new tokens")
    }
    user.refreshToken=newRefreshToken
    await user.save({validateBeforeSave:false})

    if (USE_COOKIES) 
    {
        return res.status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
            new ApiSuccess(200, "Tokens refreshed successfully", {
                refreshToken: newRefreshToken,
                accessToken: newAccessToken
            })
            );
    } 
    else 
    {
        return res.status(200).json(
            new ApiSuccess(200, "Tokens refreshed successfully", {
            refreshToken: newRefreshToken,
            accessToken: newAccessToken
        })
      );
    }
} 
catch (error) 
{
    return next(error)
}
}

export {registerUser,loginUser,logoutUser,refreshTokens}