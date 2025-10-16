import bcrypt from "bcrypt";
import  ApiError  from "../utils/ApiError.js";
import ApiSuccess  from "../utils/ApiSuccess.js";
import { User } from "../models/user.model.js";
import { Group } from "../models/group.model.js";
import jwt from "jsonwebtoken";
import {
    buildGuestInviteLink,
    cleanupExpiredGuestRooms,
    deleteGuestRoomAndUsers,
    getGuestInviteExpiryDate,
    makeNonce,
    markGuestRoomActive,
    signGuestInviteToken,
    verifyGuestInviteToken,
} from "../utils/guestRoom.utils.js";

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

const parseMinutes = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const GUEST_SESSION_TTL_MINUTES = parseMinutes(process.env.GUEST_SESSION_TTL_MINUTES, 120);

const getGuestSessionExpiryDate = () => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + GUEST_SESSION_TTL_MINUTES);
    return expiresAt;
}

const makeGuestHandleSuffix = () => {
    return Math.random().toString(16).slice(2, 6).toUpperCase();
}

const createUniqueGuestIdentity = async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
        const suffix = makeGuestHandleSuffix();
        const username = `guest_${suffix}`.toLowerCase();
        const email = `${username}_${Date.now()}@guest.local`;

        const exists = await User.findOne({ $or: [{ username }, { email }] }).select("_id");
        if (!exists) {
            return { username, email };
        }
    }

    throw new ApiError(500, "Could not generate a guest identity");
}

const issueAuthResponse = async (user) => {
    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    if (!accessToken || !refreshToken) {
        throw new ApiError(500, "Error creating tokens");
    }

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return {
        user: userObj,
        accessToken,
        refreshToken,
    };
}

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

        if (user.isGuest) {
            const roomId = user.guestRoom;
            await User.deleteOne({ _id: user._id, isGuest: true });

            if (roomId) {
                const room = await Group.findById(roomId).select("_id members isGuestRoom");
                if (room && room.isGuestRoom) {
                    room.members = (room.members || []).filter((id) => id.toString() !== user._id.toString());
                    if (room.members.length === 0) {
                        await deleteGuestRoomAndUsers(room._id);
                    } else {
                        room.guestLastActiveAt = new Date();
                        await room.save();
                    }
                }
            }

            res.clearCookie("accessToken", options);
            res.clearCookie("refreshToken", options);

            return res.status(200).json(
                new ApiSuccess(200,"User logged out")
            )
        }

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

const startGuestSession = async (req, res, next) => {
    try {
        await cleanupExpiredGuestRooms();

        const identity = await createUniqueGuestIdentity();
        const randomPassword = await bcrypt.hash(`${Date.now()}_${identity.username}`, 10);
        const guestExpiresAt = getGuestSessionExpiryDate();
        const inviteExpiry = getGuestInviteExpiryDate();
        const nonce = makeNonce();

        const guestUser = await User.create({
            username: identity.username,
            email: identity.email,
            password: randomPassword,
            isGuest: true,
            guestExpiresAt,
        });

        const room = await Group.create({
            name: `Demo Room ${identity.username.split("_")[1]}`,
            creator: guestUser._id,
            members: [guestUser._id],
            admins: [guestUser._id],
            description: "Temporary recruiter demo room",
            isGuestRoom: true,
            guestTokenNonce: nonce,
            guestTokenExpiresAt: inviteExpiry,
            guestLastActiveAt: new Date(),
            guestMaxMembers: 2,
        });

        guestUser.guestRoom = room._id;
        await guestUser.save({ validateBeforeSave: false });

        const { user, accessToken, refreshToken } = await issueAuthResponse(guestUser);
        const inviteToken = signGuestInviteToken({ roomId: room._id.toString(), nonce });
        const inviteBase = req.get("origin") || process.env.CORS_ORIGIN;
        const inviteLink = buildGuestInviteLink(inviteToken, inviteBase);

        const payload = {
            user,
            accessToken,
            refreshToken,
            room: {
                _id: room._id,
                name: room.name,
                members: room.members,
                isGuestRoom: true,
            },
            inviteToken,
            inviteLink,
            expiresAt: inviteExpiry,
        };

        if (USE_COOKIES) {
            return res.status(201)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(new ApiSuccess(201, "Guest session started", payload));
        }

        return res.status(201).json(new ApiSuccess(201, "Guest session started", payload));
    }
    catch (error) {
        return next(error);
    }
}

const joinGuestSession = async (req, res, next) => {
    try {
        await cleanupExpiredGuestRooms();

        const { inviteToken } = req.body;
        if (!inviteToken) {
            throw new ApiError(400, "Invite token is required");
        }

        let payload;
        try {
            payload = verifyGuestInviteToken(inviteToken);
        }
        catch (error) {
            throw new ApiError(401, "Invite token is invalid or expired");
        }

        const room = await Group.findById(payload.roomId);
        if (!room || !room.isGuestRoom) {
            throw new ApiError(404, "Guest room not found");
        }

        if (!room.guestTokenNonce || room.guestTokenNonce !== payload.nonce) {
            throw new ApiError(401, "Invite token mismatch");
        }

        if (room.guestTokenExpiresAt && room.guestTokenExpiresAt < new Date()) {
            throw new ApiError(401, "Invite token expired");
        }

        if ((room.members || []).length >= (room.guestMaxMembers || 2)) {
            throw new ApiError(409, "This guest room is full");
        }

        const identity = await createUniqueGuestIdentity();
        const randomPassword = await bcrypt.hash(`${Date.now()}_${identity.username}`, 10);
        const guestExpiresAt = getGuestSessionExpiryDate();

        const guestUser = await User.create({
            username: identity.username,
            email: identity.email,
            password: randomPassword,
            isGuest: true,
            guestExpiresAt,
            guestRoom: room._id,
        });

        room.members.push(guestUser._id);
        room.guestLastActiveAt = new Date();
        await room.save();

        const { user, accessToken, refreshToken } = await issueAuthResponse(guestUser);
        await markGuestRoomActive(room._id);

        const responsePayload = {
            user,
            accessToken,
            refreshToken,
            room: {
                _id: room._id,
                name: room.name,
                members: room.members,
                isGuestRoom: true,
            },
        };

        if (USE_COOKIES) {
            return res.status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(new ApiSuccess(200, "Joined guest room", responsePayload));
        }

        return res.status(200).json(new ApiSuccess(200, "Joined guest room", responsePayload));
    }
    catch (error) {
        return next(error);
    }
}

const getGuestRoom = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user?.isGuest || !user.guestRoom) {
            throw new ApiError(403, "Guest room is only available for guest users");
        }

        const room = await Group.findById(user.guestRoom).select("_id name members isGuestRoom guestMaxMembers guestTokenExpiresAt");
        if (!room || !room.isGuestRoom) {
            throw new ApiError(404, "Guest room not found");
        }

        await markGuestRoomActive(room._id);

        return res.status(200).json(
            new ApiSuccess(200, "Guest room fetched", {
                room,
            })
        );
    }
    catch (error) {
        return next(error);
    }
}

export {registerUser,loginUser,logoutUser,refreshTokens,startGuestSession,joinGuestSession,getGuestRoom}