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

const deleteMessage = async (req, res, next) => {
    try 
    {
        const { messageId } = req.body
        const userId = req.user._id

        const message = await Message.findById(messageId)
        if (!message)
        {
          throw new ApiError(404, "Message not found")
        }

        if (message.sender.toString() !== userId.toString()) 
        {
            throw new ApiError(403, "Not authorized to delete this message");
        }

        await Message.deleteOne({ _id: messageId });

        return res.status(200).json(
            new ApiSuccess(200, {}, "Group message deleted successfully")
        );
    } 
    catch (error) 
    {
      return next(error);
    }
};

const markMessagesAsRead = async (req, res, next) => {
  try 
  {
    const { messageIds } = req.body
    const userId = req.user._id

    await Message.updateMany(
      { _id: { $in: messageIds }, receiver: userId },
      { $set: { status: "read" } }
    )

    return res.status(200).json(
      new ApiSuccess(200, "Messages marked as read", { messageIds })
    )
  } 
  catch (error) 
  {
    return next(error)
  }
};

export {fetchMessages,deleteMessage,markMessagesAsRead}