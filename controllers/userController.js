const { ErrorHandler } = require("../middlewares/errorMiddlewares.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const User = require("../models/userModel.js");
const { v2: cloudinary } = require("cloudinary");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendToken = require("../utils/sendToken.js");

const MASTER_EMAIL = process.env.MASTER_EMAIL || "hardikhathwal2@gmail.com";

// Helper: generate Gravatar URL from email
const getGravatarUrl = (email, size = 200) => {
    const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
};

// Check if requesting user is the master account
const isMaster = (user) => user?.email?.toLowerCase() === MASTER_EMAIL.toLowerCase();

const getAllUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find({ accountVerified: true });
    
    // Attach gravatar URL to users without custom avatar, and flag master
    const enrichedUsers = users.map(u => {
        const userObj = u.toObject();
        if (!userObj.avatar?.url) {
            userObj.avatar = { url: getGravatarUrl(userObj.email), public_id: "gravatar" };
        }
        userObj.isMaster = userObj.email.toLowerCase() === MASTER_EMAIL.toLowerCase();
        return userObj;
    });
    
    res.status(200).json({
        success: true,
        users: enrichedUsers,
        requestingUserIsMaster: isMaster(req.user),
    });
});

const registerNewAdmin = catchAsyncErrors(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Admin avatar is required", 400));
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }

    const isRegistered = await User.findOne({ email, accountVerified: true });
    if (isRegistered) {
        return next(new ErrorHandler("User already registered", 400));
    }

    if (password.length < 8 || password.length > 16) {
        return next(new ErrorHandler("Password must be between 8 and 16 characters", 400));
    }

    const { avatar } = req.files;
    const allowedFormats = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

    if (!allowedFormats.includes(avatar.mimetype)) {
        return next(new ErrorHandler("Only jpg, jpeg, png, webp formats are allowed for avatar", 400));
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const cloudinaryResponse = await cloudinary.uploader.upload(avatar.tempFilePath, {
        folder: "Library_Management_System_Admins_Avatars"
    });

    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error("cloudinary error :" + cloudinaryResponse.error || "Unknown error.");
        return next(new ErrorHandler("Failed to upload avatar image to cloudinary.", 500));
    }

    const admin = await User.create({
        name,
        email,
        password: hashPassword,
        role: "Admin",
        accountVerified: true,
        avatar: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        },
    });

    sendToken(admin, 201, "Admin registered successfully", res);
});

// Delete user by admin (hierarchy enforced)
const deleteUserByAdmin = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.user._id.toString() === id) {
        return next(new ErrorHandler("You cannot delete your own account from here", 400));
    }

    const user = await User.findById(id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    // Prevent deleting the master account
    if (user.email.toLowerCase() === MASTER_EMAIL.toLowerCase()) {
        return next(new ErrorHandler("The master account cannot be deleted", 403));
    }

    // Only master can delete admin accounts
    if (user.role === "Admin" && !isMaster(req.user)) {
        return next(new ErrorHandler("Only the master admin can delete other admin accounts", 403));
    }

    // Check for active borrows
    const activeBorrows = user.borrowedBooks.filter(book => !book.returned);
    if (activeBorrows.length > 0) {
        return next(new ErrorHandler(
            `Cannot delete user with ${activeBorrows.length} active borrowed book(s). User must return all books first.`,
            400
        ));
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "User account deleted successfully",
    });
});

// Delete own account (user)
const deleteOwnAccount = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const activeBorrows = user.borrowedBooks.filter(book => !book.returned);
    if (activeBorrows.length > 0) {
        return next(new ErrorHandler(
            `Cannot delete account with ${activeBorrows.length} active borrowed book(s). Please return all books first.`,
            400
        ));
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
        success: true,
        message: "Your account has been deleted successfully",
    });
});

// Promote user to admin
const promoteUserToAdmin = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (user.role === "Admin") {
        return next(new ErrorHandler("User is already an admin", 400));
    }

    user.role = "Admin";
    await user.save();

    res.status(200).json({
        success: true,
        message: `${user.name} has been promoted to admin successfully`,
        user,
    });
});

// Demote admin to user — MASTER ONLY
const demoteAdminToUser = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    // Only master can demote
    if (!isMaster(req.user)) {
        return next(new ErrorHandler("Only the master admin can demote other admins", 403));
    }

    const user = await User.findById(id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    // Can't demote the master account
    if (user.email.toLowerCase() === MASTER_EMAIL.toLowerCase()) {
        return next(new ErrorHandler("The master account cannot be demoted", 403));
    }

    if (user.role !== "Admin") {
        return next(new ErrorHandler("User is not an admin", 400));
    }

    user.role = "User";
    await user.save();

    res.status(200).json({
        success: true,
        message: `${user.name} has been demoted to user`,
        user,
    });
});

module.exports = { getAllUsers, registerNewAdmin, deleteUserByAdmin, deleteOwnAccount, promoteUserToAdmin, demoteAdminToUser };