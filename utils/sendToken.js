const sendToken = (user, statusCode, message, res) => {
    const token = user.generateToken();

    res
        .status(statusCode)
        .cookie("token", token, {
            expires: new Date(
                Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production"
        }).json({
            success: true,
            user,
            message,
            token,
        });
};

module.exports = sendToken;