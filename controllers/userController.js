const { ErrorHandler } = require("../middlewares/errorMiddlewares.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const User = require("../models/userModel.js");
const { v2: cloudinary } = require("cloudinary");
const bcrypt = require("bcrypt");

const getAllUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find({ accountVerified: true });
    res.status(200).json({
        success: true,
        users,
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
    })

    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error("cloudinary error :" + cloudinaryResponse.error || "Unknown error.");
        return next(new ErrorHandler("faied to upload avatar image to cloudinary.", 500));
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


    res.status(201).json({
        success: true,
        message: "Admin registered successfully",
    });
});

// Delete user by admin
const deleteUserByAdmin = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
        return next(new ErrorHandler("Admins cannot delete their own account", 400));
    }

    const user = await User.findById(id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    // Check if user has active borrows
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

    // Check if user has active borrows
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

module.exports = { getAllUsers, registerNewAdmin, deleteUserByAdmin, deleteOwnAccount };