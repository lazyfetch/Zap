import mongoose, {Schema} from "mongoose";

const userSchema = new Schema(
    {
        username: 
        {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
            index: true
        },
        email: 
        {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
        },
        fullName: 
        {
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        avatar: {
            type: String, 
            default:"/avatars/default.png",
        },
        password: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)



export const User = mongoose.model("User", userSchema)
