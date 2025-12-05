const { ErrorHandler } = require("../middlewares/errorMiddlewares.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const User = require("../models/userModel.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendToken = require("../utils/sendToken.js");

const register = catchAsyncErrors(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return next(new ErrorHandler("Please enter all fields", 400));
        }
        const isRegistered = await User.findOne({ email, accountVerified: true });
        if (isRegistered) {
            return next(new ErrorHandler("User already registered, please login", 400));
        }

        // Clean up any unverified accounts with the same email
        await User.deleteMany({
            email,
            accountVerified: false
        });

        if (password.length < 6 || password.length > 16) {
            return next(new ErrorHandler("Password must be between 6 and 16 characters", 400));
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // creating user here with accountVerified set to true
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            accountVerified: true,
        });

        sendToken(user, 200, "Registration successful", res);

    } catch (error) {
        next(error);
    }
});

const login = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }

    const user = await User.findOne({ email, accountVerified: true }).select("+password");

    if (!user) {
        return next(new ErrorHandler("User not found, please register", 404));
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    sendToken(user, 200, "Login successful", res);

});

const logout = catchAsyncErrors(async (req, res, next) => {
    res.status(200).cookie("token", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
    }).json({
        success: true,
        message: "Logged out successfully",
    });
});

const getUser = catchAsyncErrors(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
});

const forgotPassword = catchAsyncErrors(async (req, res, next) => {

    if (!req.body.email) {
        return next(new ErrorHandler("Email is required.", 400));
    }

    const user = await User.findOne({
        email: req.body.email,
        accountVerified: true
    });

    if (!user) {
        return next(new ErrorHandler("User not found, please register", 404));
    }
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

    res.status(200).json({
        success: true,
        message: `Password reset link generated successfully`,
        resetToken: resetToken,
        resetUrl: resetPasswordUrl,
    });

});

const resetPassword = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.params;

    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorHandler("Invalid or expired password reset token", 400));
    }

    if (req.body.password != req.body.confirmPassword) {
        return next(new ErrorHandler("Password and confirm password do not match", 400));
    }

    if (req.body.password.length < 8 || req.body.password.length > 16 || req.body.confirmPassword.length < 8 || req.body.confirmPassword.length > 16) {
        return next(new ErrorHandler("Password must be between 8 and 16 characters", 400));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, "Password reset successful", res);

});

const updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("+password");

    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }

    const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Current password is incorrect", 401));
    }

    if (newPassword.length < 8 || newPassword.length > 16 || confirmNewPassword.length < 8 || confirmNewPassword.length > 16) {
        return next(new ErrorHandler("Password must be between 8 and 16 characters", 400));
    }

    if (newPassword !== confirmNewPassword) {
        return next(new ErrorHandler("New password and confirm new password do not match", 400));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password updated successfully",
    });
});

module.exports = { register, login, logout, getUser, forgotPassword, resetPassword, updatePassword };

