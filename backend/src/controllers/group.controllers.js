import { Group } from "../models/group.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiSuccess from "../utils/ApiSuccess.js";

const createGroup = async (req, res) => {
    try {
        const { name, description, creatorId } = req.body
    
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
        const { groupId, userId, adminId } = req.body;

        if (!groupId || !userId || !adminId) 
        {
            throw new ApiError(400, "Group ID, User ID, and Admin ID are required")
        }

        const group = await Group.findById(groupId);
        if (!group) 
        {
            throw new ApiError(404, "Group not found")
        }

        if (!group.admins.includes(adminId)) 
        {
            throw new ApiError(403, "Not authorized")
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

export { createGroup, addMember, removeMember, deleteGroup }