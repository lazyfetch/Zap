import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiSuccess from "../utils/ApiSuccess.js"

const LoginCheck=async(req,res)=>{
    console.log("You are logged in!!!")
    const user=req.user
    return res.status(200)
    .json({
        success:true,
        message:"Done",
        data:{user}
    })
}

const UsersList=async(req,res,next)=>{
    try 
    {
        const {userId}=req.body
        const users=await User.find({ _id: {$ne:userId}})
    
        if(!users)
        {
            throw new ApiError(400,"No users found")
        }
        return res.status(200).json(
            new ApiSuccess(200,"Users found",users)
        )
    } 
    catch (error) 
    {
        return next(error)
    }
}

export {LoginCheck,UsersList}