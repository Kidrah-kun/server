const { v2: cloudinary } = require("cloudinary");
const { app } = require("./app.js");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
    api_key: process.env.CLOUDINARY_CLIENT_API,
    api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});


const PORT = process.env.PORT || 3000; 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
