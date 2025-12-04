const mongoose = require("mongoose");

const connectDB = () => {
  mongoose.connect(process.env.MONGO_URI, { dbName: "library_management_system" }).then(()=>{
    console.log("Database connected Successfully");
  }).catch((err)=>{
    console.log("Error while connecting to database", err);
  });
};

module.exports = { connectDB };

 