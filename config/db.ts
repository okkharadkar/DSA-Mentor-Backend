import mongoose from "mongoose"
const connectDB = async () => {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
        throw new Error("MONGO_URI is missing in environment variables.");
    }
    try {
        const conn = await mongoose.connect(MONGO_URI)
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.log(`Error ${error.message}`);
        process.exit(1);

    }
}
module.exports = { connectDB };