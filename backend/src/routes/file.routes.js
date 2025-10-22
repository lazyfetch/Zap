import { Router } from "express";
import { requireNonGuest, verifyLogin } from "../middleware/auth.middleware.js"
import { upload } from "../middleware/multer.middleware.js";
import { uploadFile } from "../controllers/file.controllers.js";


const fileRouter=Router()

fileRouter.route("/upload-file").post(verifyLogin,requireNonGuest,upload.single("file"),uploadFile)


export default fileRouter