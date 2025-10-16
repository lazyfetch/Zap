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
        },
        isGuestRoom:
        {
          type: Boolean,
          default: false,
          index: true
        },
        guestTokenNonce:
        {
          type: String,
          default: null
        },
        guestTokenExpiresAt:
        {
          type: Date,
          default: null
        },
        guestLastActiveAt:
        {
          type: Date,
          default: null
        },
        guestMaxMembers:
        {
          type: Number,
          default: 2
        }
  },
  {
    timestamps: true,
  }
);

export const Group = mongoose.model("Group", groupSchema);