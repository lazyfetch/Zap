import { User } from "../models/user.model.js";
import ApiSuccess from "../utils/ApiSuccess.js";
import ApiError from "../utils/ApiError.js";
import { uploadCloudinary } from "../cloudinary.js";
import fs from "fs";

const LoginCheck = async (req, res) => {
  const user = req.user;
  return res.status(200).json({
    success: true,
    message: "Done",
    data: { user },
  });
};

const UsersList = async (req, res, next) => {
  try 
  {
    const {userId} = req.body;
    const users = await User.find({ _id: { $ne: userId } });

    if (!users) 
    {
      throw new ApiError(400, "No users found");
    }
    return res.status(200).json(new ApiSuccess(200, "Users found", users));
  } 
  catch (error) 
  {
    return next(error)
  }
};

const updatePresence = async (req, res, next) => {
  try 
  {
    const userId = req.user._id
    const {online} = req.body
    const update = {online}
    if (!online)
    {
        update.lastSeen = new Date()
    }
    await User.findByIdAndUpdate(userId, update)
    return res.status(200).json(new ApiSuccess(200, "Presence updated", update))
  } 
  catch (error) 
  {
    return next(error)
  }
}

const getPresence = async (req, res, next) => {
  try 
  {
    const userId = req.params.userId
    const user = await User.findById(userId).select("online lastSeen")
    if (!user)
    {
        throw new ApiError(404, "User not found")
    }
    return res.status(200).json(new ApiSuccess(200, "Presence fetched", user))
  } 
  catch (error) 
  {
    return next(error)
  }
}

const changeUsername = async (req, res, next) => {
  try 
  {
    const { newUsername } = req.body
    const userId = req.user._id

    const user = await User.findById(userId)
    
    if (!user) 
    {
      throw new ApiError(400, "No such user exists");
    }

    user.username = newUsername
    await user.save()

    return res.status(200).json(new ApiSuccess(200, "Username updated", { username: user.username }))
  } 
  catch (error) 
  {
    return next(error)
  }
}

const changePassword = async (req, res, next) => {
  try 
  {
    const { newPassword } = req.body
    const userId = req.user._id

    const user = await User.findById(userId)
    
    if (!user) 
    {
      throw new ApiError(400, "No such user exists");
    }
    const saltRounds=10
    user.password = await bcrypt.hash(newPassword,saltRounds)
    user.refreshToken = ""
    await user.save()

    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")
    return res.status(200).json(new ApiSuccess(200, "Password updated, please login again", { }))
  } 
  catch (error) 
  {
    return next(error)
  }
}

const deleteAccount = async (req, res, next) => {
  try 
  {
    const userId = req.user._id
    const user = await User.findById(userId)

    if (!user) 
    {
      throw new ApiError(400, "No such user exists")
    }
    
    await User.deleteOne({ _id: userId })

    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")
    return res.status(200).json(new ApiSuccess(200, "Account deleted"))
  } 
  
  catch (error) 
  {
    return next(error)
  }
}

const changeAvatar = async (req, res, next) => {
  try 
  {
    const userId = req.user._id
    const user = await User.findById(userId)
    if (!user) 
    {
      throw new ApiError(400, "No such user exists")
    }
    if (!req.file) 
    {
      throw new ApiError(400, "No file uploaded")
    }

    const cloudRes = await uploadCloudinary(req.file.path)
    
    if (!cloudRes) 
    {
      throw new ApiError(500, "Cloudinary upload failed")
    }

    user.avatar = cloudRes.secure_url;
    await user.save()

    fs.unlinkSync(req.file.path)

    return res.status(200).json(new ApiSuccess(200, "Avatar updated", { avatar: user.avatar }));
  } 
  catch (error) 
  {
    return next(error)
  }
}

export { LoginCheck, UsersList, updatePresence, getPresence,changeUsername,changePassword,deleteAccount,changeAvatar }