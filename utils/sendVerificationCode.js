const {generateVerificationOtpEmailTemplate} = require("./emailTemplates.js");
const sendEmail = require("./sendEmail.js");

async function sendVerificationCode(verificationCode,email,res){
    try {
        const message = generateVerificationOtpEmailTemplate(verificationCode);
        sendEmail({
            email,
            subject:"Verification Code for GoodLIB (Library Management System)",
            message,
        });
        res.status(200).json({
        success: true,
        message: `Verification code sent to ${email} successfully`,
        })

    } catch (error) {
        return res.status(500).json({
        success: false,
        message: "Failed to send verification code",
        error: error.message
        })
    }
}

module.exports = sendVerificationCode;
