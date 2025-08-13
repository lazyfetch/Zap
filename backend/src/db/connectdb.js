import mongoose from "mongoose";

const connectdb=async ()=>{
    try {
        const connectionInstance=await mongoose.connect(process.env.MONGODB_URI)
        console.log(`MongoDB connected DB host: ${connectionInstance.connection.host}`);
    } 
    catch (error) 
    {
        console.log(error)
        throw error
    }

}

export default connectdb
