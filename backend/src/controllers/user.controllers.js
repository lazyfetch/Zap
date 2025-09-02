import { User } from "../models/user.model.js";
import ApiSuccess from "../utils/ApiSuccess.js";
import ApiError from "../utils/ApiError.js";

const LoginCheck = async (req, res) => {
  console.log("You are logged in!!!");
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

export { LoginCheck, UsersList, updatePresence, getPresence }