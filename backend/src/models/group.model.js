import mongoose, { Schema } from "mongoose";

const groupSchema = new Schema(
    {
        name: 
        {
          type: String,
          required: true,
          trim: true,
        },
        creator: 
        {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        members: 
        [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        ],
        admins: 
        [
          {
              type: Schema.Types.ObjectId,
              ref: "User",
          },
        ],
        avatar: 
        {
          type: String,
          default: "/avatars/default-group.png",
        },
        description: 
        {
          type: String,
          default: "",
          trim: true,
        }
  },
  {
    timestamps: true,
  }
);

export const Group = mongoose.model("Group", groupSchema);