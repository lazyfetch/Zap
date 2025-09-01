import { Group } from "../models/group.model.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import ApiError from "../utils/ApiError.js";
import ApiSuccess from "../utils/ApiSuccess.js";
import mongoose from "mongoose";

const getAllGroups = async (req, res) => {
    try 
    {
        const groups = await Group.find()
        return res.status(200).json(
            new ApiSuccess(200, { groups }, "All groups fetched successfully")
        )
    } 
    catch (error) 
    {
        return res.status(500).json(
            new ApiError(500, `Error fetching all groups: ${error}`)
        )
    }
};


const createGroup = async (req, res) => {
    try 
    {
        const { name, description} = req.body
        const creatorId = req.user._id;
    
        if (!name || !creatorId) 
        {
            throw new ApiError(400, "Group name and creator ID are required")
        }
    
        const creator = await User.findById(creatorId)
        if (!creator) 
        {
            throw new ApiError(404, "User not found")
        }
    
        const group = new Group({
            name, 
            description,
            creator: creatorId,
            members: [creatorId],
            admins: [creatorId],
        })
    
        await group.save()
        console.log("Group created")
        return res.status(201).json(
            new ApiSuccess(201, { group }, "Group created successfully")
        );
    } 
    catch (error) 
    {
      throw new ApiError(500,`Error creating the group: ${error}`)  
    }
}

const addMember = async (req, res) => {
    try 
    {
        const { groupId, userId} = req.body;

        if (!groupId || !userId ) 
        {
            throw new ApiError(400, "Group ID, User ID, and Admin ID are required")
        }

        const group = await Group.findById(groupId);
        if (!group) 
        {
            throw new ApiError(404, "Group not found")
        }

        const user = await User.findById(userId);
        if (!user) 
        {
            throw new ApiError(404, "User not found")
        }

        if (group.members.includes(userId)) 
        {
            throw new ApiError(400, "User already in group")
        }

        group.members.push(userId)
        await group.save()

        return res.status(200).json(
            new ApiSuccess(200, { group }, "Member added successfully")
        )
    } 
    catch (error) 
    {
        throw new ApiError(500, `Error adding member: ${error}`)
    }
}

const removeMember = async (req, res) => {
    try 
    {
        const { groupId, userId, adminId } = req.body

        if (!groupId || !userId || !adminId) 
        {
            throw new ApiError(400, "Group ID, User ID, and Admin ID are required")
        }

        const group = await Group.findById(groupId)

        if (!group) 
        {
            throw new ApiError(404, "Group not found")
        }

        if (!group.admins.includes(adminId)) 
        {
            throw new ApiError(403, "Not authorized")
        }

        if (!group.members.includes(userId)) 
        {
            throw new ApiError(400, "User is not a member of the group")
        }

        if (group.admins.includes(userId) && group.admins.length === 1) 
        {
            throw new ApiError(400, "Cannot remove the last admin")
        }

        let newMembers = []
        for (let id of group.members) 
        {
            if (id.toString() !== userId) 
            {
                newMembers.push(id)
            }
        }
        group.members = newMembers

        let newAdmins = []
        for (let id of group.admins) 
        {
            if (id.toString() !== userId) 
            {
                newAdmins.push(id)
            }
        }
        group.admins = newAdmins

        await group.save()

        return res.status(200).json(
            new ApiSuccess(200, { group }, "Member removed successfully")
        )
    } 
    catch (error) 
    {
        throw new ApiError(500, `Error removing member: ${error}`)
    }
}

const deleteGroup = async (req, res) => {
    try 
    {
        const { groupId, userId } = req.body

        if (!groupId || !userId) 
        {
            throw new ApiError(400, "Group ID and User ID are required")
        }

        const group = await Group.findById(groupId)

        if (!group) 
        {
            throw new ApiError(404, "Group not found")
        }

        if (group.creator.toString() !== userId && !group.admins.includes(userId)) 
        {
            throw new ApiError(403, "Not authorized to delete this group")
        }

        await Group.findByIdAndDelete(groupId);

        return res.status(200).json(
            new ApiSuccess(200, {}, "Group deleted successfully")
        )
    } 
    catch (error) 
    {
        throw new ApiError(500, `Error deleting group: ${error}`)
    }
}

const getGroup = async (req, res) => {
    try     
    {
        const { groupId, userId } = req.body

        if (!groupId || !userId) 
        {
            throw new ApiError(400, "Group ID and User ID are required")
        }

        const group = await Group.findById(groupId).populate('members', 'username email').populate('admins', 'username email');
        
        if (!group) 
        {
            throw new ApiError(404, "Group not found")
        }

        if (!group.members.includes(userId)) 
        {
            throw new ApiError(403, "Not a member of this group")
        }

        return res.status(200).json(
            new ApiSuccess(200, { group }, "Group details fetched successfully")
        );
    } 
    catch (error) 
    {
        throw new ApiError(500, `Error fetching group: ${error}`)
    }
}

const updateGroup = async (req, res) => {
    try 
    {
        const { groupId, userId, name, description } = req.body

        if (!groupId || !userId) 
        {
            throw new ApiError(400, "Group ID and User ID are required")
        }

        const group = await Group.findById(groupId)

        if (!group) 
        {
            throw new ApiError(404, "Group not found")
        }

        if (!group.admins.includes(userId))
        {
            throw new ApiError(403, "Not authorized to update this group")
        }

        if (name)
        {
            group.name = name
        }

        if (description)
        {
            group.description = description
        }

        await group.save()

        return res.status(200).json(
            new ApiSuccess(200, { group }, "Group updated successfully")
        )
    } 
    catch (error)
    {
        throw new ApiError(500, `Error updating group: ${error}`);
    }
};

const leaveGroup = async (req, res) => {
    try 
    {
        const { groupId, userId } = req.body

        if (!groupId || !userId)
        {
            throw new ApiError(400, "Group ID and User ID are required")
        }

        const group = await Group.findById(groupId)
        if (!group) 
        {
            throw new ApiError(404, "Group not found")
        }

        if (!group.members.includes(userId))
        {
            throw new ApiError(400, "User is not a member of the group")
        }

        if (group.creator.toString() === userId) 
        {
            throw new ApiError(400, "Creator cannot leave the group; delete it instead")
        }

        if (group.admins.includes(userId) && group.admins.length === 1)
        {
            throw new ApiError(400, "Cannot leave as the last admin");
        }

        group.members = group.members.filter(id => id.toString() !== userId);
        group.admins = group.admins.filter(id => id.toString() !== userId);

        await group.save()

        return res.status(200).json(
            new ApiSuccess(200, { group }, "Left group successfully")
        );
    } 
    catch (error)
    {
        throw new ApiError(500, `Error leaving group: ${error}`);
    }
}

const getUserGroups = async (req, res) => {
    try 
    {
        const userId = req.user._id;

        if (!userId) 
        {
            throw new ApiError(400, "User ID is required")
        }

        const groups = await Group.find({ members: userId }).populate('members', 'username').populate('admins', 'username')

        return res.status(200).json(
            new ApiSuccess(200, { groups }, "User groups fetched successfully")
        )
    } 
    catch (error) 
    {
        throw new ApiError(500, `Error fetching user groups: ${error}`)
    }
};

const createGroupMessage = async (req, res, next) => {
    try 
    {
        const { content, group } = req.body
        const userId = req.user._id

        if (!content || !group || !group._id)
        {
            throw new ApiError(400, "Content and group are required")
        }

        const groupDoc = await Group.findById(group._id)
        if (!groupDoc)
        {
            throw new ApiError(404, "Group not found")
        }
            
        if (!groupDoc.members.includes(userId))
        {
            throw new ApiError(403, "Not a member of this group")
        }

        const message = new Message({
            sender: userId,
            receiver: null, 
            content: content,
            roomId: group._id
        });

        await message.save()

        return res.status(201).json(
            new ApiSuccess(201, { message }, "Group message sent")
        );
    } 
    catch (error) 
    {
        return next(error);
    }
}

const getGroupMessages = async (req, res, next) => {
    try {
        const { groupId } = req.body;
        const userId = req.user._id;

        console.log("Requested groupId:", groupId);

        const group = await Group.findById(groupId);
        if (!group) {
            console.log("Group not found for groupId:", groupId);
            throw new ApiError(404, "Group not found");
        }
        if (!group.members.includes(userId)) {
            console.log("User not a member:", userId, "Group members:", group.members);
            throw new ApiError(403, "Not a member of this group");
        }

        const queryRoomId = new mongoose.Types.ObjectId(groupId);
        console.log("Querying messages with roomId:", queryRoomId);

        const messages = await Message.find({ roomId: queryRoomId }).sort({ createdAt: 1 });

        console.log("Messages found:", messages);

        return res.status(200).json(
            new ApiSuccess(200,"Group messages fetched successfully",{ messages })
        )
    } 
    catch (error) 
    {
        return next(error);
    }
};

const deleteGroupMessage = async (req, res, next) => {
    try 
    {
        const { messageId, groupId } = req.body
        const userId = req.user._id

        const message = await Message.findById(messageId)
        const group = await Group.findById(groupId)

        if (!group) 
        {
            throw new ApiError(404, "Group not found")
        }
        if (!group.members.includes(userId)) 
        {
            throw new ApiError(403, "Not a member of this group")
        }
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

export { getAllGroups,createGroup, addMember, removeMember, deleteGroup, getGroup, updateGroup, leaveGroup, getUserGroups, createGroupMessage,getGroupMessages,deleteGroupMessage }