const mongoose = require("mongoose");

// Cache the connection across serverless function invocations
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("Using existing database connection");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "library_management_system",
      bufferCommands: false, // Disable buffering — fail fast instead of timeout
    });
    isConnected = true;
    console.log("Database connected Successfully");
  } catch (err) {
    console.log("Error while connecting to database", err);
    throw err;
  }
};

module.exports = { connectDB };

 