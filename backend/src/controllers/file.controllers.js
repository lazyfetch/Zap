import { uploadCloudinary } from "../cloudinary.js"
import ApiError from "../utils/ApiError.js"
import ApiSuccess from "../utils/ApiSuccess.js"
import fs from "fs/promises"

const uploadFile= async(req,res,next)=>{
    try 
    {
        if(!req.file)
        {
            throw new ApiError(400,"File needed")
        }
        const result=await uploadCloudinary(req.file.path)
        if(!result)
        {
            throw new ApiError(500,"Error while uploading the file on cloudinary")
        }
        
        const data={
            url:result.secure_url,
            public_id:result.public_id,
            originalName:req.file.originalname,
            mimetype:req.file.mimetype,
            size:req.file.size,
            fileSize:req.file.size
        }
        return res.status(200).json(
            new ApiSuccess(200,"File uploaded successfully",{data})
        )
    } 
    catch (error) 
    {
        next(error)
    }
    finally 
    {
        if (req.file) 
        {
            try 
            {
                await fs.unlink(req.file.path);
            } 
            catch (error) 
            {
                console.log("Error deleting the file from public/temp")
            }
        }
    }
}

export {uploadFile}