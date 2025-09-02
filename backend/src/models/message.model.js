import mongoose, {Schema} from "mongoose";

const messageSchema= new Schema(
    {
        sender:
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        receiver:
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        mediaUrl: 
        {
            type: String,
            default: null,
        },
        mediaType:
        {
            type: String,
            enum: ["text", "image", "video", "file"],
            default: "text",
        },
        fileSize: 
        {
            type: Number,
            default: null
        },
        content:
        {
            type:String,
            required:true,
            index:true
        },
        status:
        {
            type:String,
            default: "sent",
            enum: ["sent", "delivered", "seen"]
        },
        roomId: 
        { 
            type: Schema.Types.ObjectId, 
            ref: "Group", 
            default: null 
        },
        tempId:
        {
            type:String
        }
    },
    {
        timestamps: true
    }
)

export const Message = mongoose.model("Message", messageSchema)
