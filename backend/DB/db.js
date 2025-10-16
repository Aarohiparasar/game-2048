import mongoose from "mongoose";

const connectMongpDB=async()=>{
    try {
        const connect=await mongoose.connect(process.env.MONGO_URI)
        console.log("mongoDB connected successfully")
    } catch (error) {
        console.log(`Error in connecting mongoDB:${error}`)
        process.exit(1)
    }
}
export default connectMongpDB