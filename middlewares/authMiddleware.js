const { catchAsyncErrors } = require("./catchAsyncErrors.js");
const {ErrorHandler} = require("../middlewares/errorMiddlewares.js");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");

const isAuthenticated = catchAsyncErrors(async(req,res,next) => {
    const { token } = req.cookies;

    if(!token){
        return next(new ErrorHandler("User is not Authenticated.",400));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log("Decoded JWT:", decoded); // Debugging line to check decoded token
    
    req.user = await User.findById(decoded.id);
    next();
});

const isAuthorized = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resource`,403));
        }
        next();
    };
};

// Middleware to allow first admin creation without authentication, but require Admin auth if admins exist
const allowFirstAdminOrRequireAuth = catchAsyncErrors(async (req, res, next) => {
    const adminCount = await User.countDocuments({ role: "Admin", accountVerified: true });
    
    // If no admins exist, allow the request to proceed without authentication
    if (adminCount === 0) {
        return next();
    }
    
    // If admins exist, require authentication and Admin role
    const { token } = req.cookies;
    if (!token) {
        return next(new ErrorHandler("User is not Authenticated.", 400));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    
    if (!req.user || req.user.role !== "Admin") {
        return next(new ErrorHandler("Only Admins can create new admins", 403));
    }
    
    next();
});

module.exports = { isAuthenticated, isAuthorized, allowFirstAdminOrRequireAuth };  