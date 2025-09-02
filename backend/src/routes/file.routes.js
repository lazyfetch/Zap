import { Router } from "express";
import { verifyLogin } from "../middleware/auth.middleware.js"
import { upload } from "../middleware/multer.middleware.js";
import { uploadFile } from "../controllers/file.controllers.js";


const fileRouter=Router()

fileRouter.route("/upload-file").post(verifyLogin,upload.single("file"),uploadFile)


export default fileRouter