import { Message } from "../models/message.model.js"
import ApiError from "../utils/ApiError.js";
import ApiSuccess from "../utils/ApiSuccess.js";

const fetchMessages = async (req, res,next) => {
  const { userId, otherUserId } = req.body;
  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    }).sort({ createdAt: 1 })
    res.status(200).json(
      new ApiSuccess(200, "Messages fetched successfully", messages)
    );
  } 
  catch (err) 
  {
    return next()
  }
}

export {fetchMessages}