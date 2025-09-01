import { Router } from "express";
import { verifyLogin } from "../middleware/auth.middleware.js"
import { addMember, createGroup, createGroupMessage, deleteGroup, deleteGroupMessage, getGroup, getGroupMessages, getUserGroups, leaveGroup, removeMember, updateGroup,getAllGroups } from "../controllers/group.controllers.js";


const groupRouter=Router()

groupRouter.route("/create-group").post(verifyLogin,createGroup)
groupRouter.route("/add-member").post(verifyLogin, addMember)
groupRouter.route("/remove-member").post(verifyLogin, removeMember)
groupRouter.route("/update-group").patch(verifyLogin, updateGroup)
groupRouter.route("/delete").delete(verifyLogin, deleteGroup)
groupRouter.route("/get-group").post(verifyLogin, getGroup)
groupRouter.route("/leave-group").post(verifyLogin, leaveGroup)
groupRouter.route("/groups").get(verifyLogin, getUserGroups)
groupRouter.route("/create-message").post(verifyLogin, createGroupMessage)
groupRouter.route("/messages").post(verifyLogin, getGroupMessages)
groupRouter.route("/delete-message").delete(verifyLogin, deleteGroupMessage)
groupRouter.route("/all").get(verifyLogin, getAllGroups)

export default groupRouter