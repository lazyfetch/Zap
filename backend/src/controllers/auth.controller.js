import ApiError from "../utils/ApiError.js"
import ApiSuccess from "../utils/ApiSuccess.js"
import { User } from "../models/user.model.js"
import bcrypt from "bcrypt"

const registerUser = async(req,res,next)=>
{
    try 
    {
        const {username, email, password} = req.body
        
        if(!username || !email || !password) 
        {
            throw new ApiError(400, "All fields are required")
        }
        const existingUser = await User.findOne({
            $or: [{username}, {email}]
        })
    
        if(existingUser)
        {
            throw new ApiError(409, "User already exists")
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

export {registerUser}