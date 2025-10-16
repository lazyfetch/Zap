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
        avatar: 
        {
            type: String, 
            default:"/avatars/default.png",
        },
        password: 
        {
            type: String,
            required: true
        },
        provider: 
        {
            type: String,
            default: "local",
            enum: ["local", "google", "facebook", "github"]
        },
        providerId: 
        {
            type: String,
            default: null
        },
        refreshToken: 
        {
            type: String,
            default: null
        },
        online:
        {
            type:Boolean,
            default:false
        },
        lastSeen:
        {
            type:Date
        },
        isGuest:
        {
            type: Boolean,
            default: false
        },
        guestExpiresAt:
        {
            type: Date,
            default: null
        },
        guestRoom:
        {
            type: Schema.Types.ObjectId,
            ref: "Group",
            default: null
        }
    },
    {
        timestamps: true
    }
)



export const User = mongoose.model("User", userSchema)
