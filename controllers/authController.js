const {ErrorHandler} = require("../middlewares/errorMiddlewares.js");
const {catchAsyncErrors} = require("../middlewares/catchAsyncErrors.js");
const User = require("../models/userModel.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendVerificationCode = require("../utils/sendVerificationCode.js");
const sendToken = require("../utils/sendToken.js");
const { use } = require("react");
const {generateForgotPasswordEmailTemplate} = require("../utils/emailTemplates.js");
const sendEmail = require("../utils/sendEmail.js");

const register = catchAsyncErrors(async(req,res,next)=>{
    try{
        const {name,email,password} = req.body;
        if(!name || !email || !password){
            return next(new ErrorHandler("Please enter all fields",400));
        }
        const isRegistered = await User.findOne({email,accountVerified:true});
        if(isRegistered){
            return next(new ErrorHandler("User already registered, please login",400));
        }

        const registrationAttemptsByUser = await User.find({
            email,
            accountVerified:false
        })

        if(registrationAttemptsByUser.length >=5 ){
            return next(new ErrorHandler("Too many registeration attempts, please try again later",400));
        }
        if(password.length < 6 || password.length > 16){
            return next(new ErrorHandler("Password must be between 6 and 16 characters",400));
        }

        const hashedPassword = await bcrypt.hash(password,10);

        // creating user here
        const user = await User.create({
            name,
            email,
            password:hashedPassword,
        });
        const verificationCode = await user.generateVerificationCode();
        await user.save();
        sendVerificationCode(verificationCode,email,res);

    }catch(error){
        next(error);
    }
});

const verifyOTP = catchAsyncErrors(async(req,res,next)=>{
    const { email, otp } = req.body;

    if(!email || !otp){
        return next(new ErrorHandler("Email or OTP is missing",400));
    }

    try{
        const userAllEntries = await User.find({
            email,
            accountVerified:false
        }).sort({createdAt:-1}); // this will give all entries of user with given email sorted by createdAt in descending order (mongo db sort function)

    if(!userAllEntries || userAllEntries.length === 0 ){
        return next(new ErrorHandler("No registration attempts found for this email",404));
    }

    if(userAllEntries.length > 1){
        user = userAllEntries[0]; // get the latest entry
        await User.deleteMany({
            _id: {$ne:user._id},  // delete all other entries except the latest one
            email,
            accountVerified:false
        });
    }else{
        user = userAllEntries[0];
    }

    if(user.verificationCode !== Number(otp)){
        return next( new ErrorHandler("Invalid OTP, please try again",400));
    }

    const currentTime = Date.now();
    const verificationCodeExpire = new Date(
        user.verificationCodeExpire
    ).getTime();

    if(currentTime > verificationCodeExpire){
        return next(new ErrorHandler("OTP has expired, please register again",400));
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save({ validateModifiedOnly:true }); // only the modified data is validated 

    sendToken(user,200,"Account verified.",res);

    }catch(error){
        next(new ErrorHandler("Internal Server Error",500));
    }
});

const login = catchAsyncErrors(async(req,res,next)=>{
    const {email,password} = req.body;
    if(!email || !password){
        return next(new ErrorHandler("Please enter all fields",400));
    }

    const user = await User.findOne({email,accountVerified:true}).select("+password");

    if(!user){
        return next(new ErrorHandler("User not found, please register",404));
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid email or password",401));
    }
    
    sendToken(user,200,"Login successful",res);

});

const logout = catchAsyncErrors(async(req,res,next)=>{
    res.status(200).cookie("token","",{
        expires:new Date(Date.now()),
        httpOnly:true,}).json({
            success:true,
            message:"Logged out successfully",
        });
});

const getUser = catchAsyncErrors(async(req,res,next)=>{
    const user = req.user;
    res.status(200).json({
        success:true,
        user,
    });
});

const forgotPassword = catchAsyncErrors(async(req,res,next)=>{

    if(!req.body.email){
        return next(new ErrorHandler("Email is required.",400));
    }

    const user = await User.findOne({
        email:req.body.email, 
        accountVerified:true});

    if(!user){
        return next(new ErrorHandler("User not found, please register",404));
    }
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave:false });
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

    const message = generateForgotPasswordEmailTemplate(resetPasswordUrl);

    try {
        await sendEmail({
            email:user.email,
            subject: "Library Management System - Password Recovery",
            message,
        });

        res.status(200).json({
            success:true,
            message:`Email sent to ${user.email} successfully`,
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave:false });
        return next(new ErrorHandler(error.message,500));
    }

});

const resetPassword = catchAsyncErrors(async(req,res,next)=>{
    const {token} = req.params;

    const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt:Date.now()},
    });
    
    if(!user){
        return next(new ErrorHandler("Invalid or expired password reset token",400));
    }

    if(req.body.password != req.body.confirmPassword){
        return next(new ErrorHandler("Password and confirm password do not match",400));
    }

    if(req.body.password.length < 8 || req.body.password.length > 16 || req.body.confirmPassword.length < 8 || req.body.confirmPassword.length > 16){
        return next(new ErrorHandler("Password must be between 8 and 16 characters",400));
    }

    const hashedPassword = await bcrypt.hash(req.body.password,10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    sendToken(user,200,"Password reset successful",res);

});

const updatePassword = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findById(req.user._id).select("+password");

    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    
    if(!currentPassword || !newPassword || !confirmNewPassword){
        return next(new ErrorHandler("Please enter all fields",400));
    }

    const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Current password is incorrect",401));
    }

    if(newPassword.length < 8 || newPassword.length > 16 || confirmNewPassword.length < 8 || confirmNewPassword.length > 16){
        return next(new ErrorHandler("Password must be between 8 and 16 characters",400));
    }

    if(newPassword !== confirmNewPassword){
        return next(new ErrorHandler("New password and confirm new password do not match",400));
    }

    const hashedPassword = await bcrypt.hash(newPassword,10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({
        success:true,
        message:"Password updated successfully",
    });
});

module.exports = { register, verifyOTP, login, logout, getUser, forgotPassword ,resetPassword, updatePassword };

