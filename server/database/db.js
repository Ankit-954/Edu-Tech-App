import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
  try {
    // Connect to the MongoDB database using the URI from the .env file
    await mongoose.connect(process.env.DB);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1); // Exit the process on failure
  }
};

export { connectDb };