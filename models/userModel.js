const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
        minlength:6,
        select:false
    },
    role:{
        type:String,
        enum:["Admin","User"],
        default:"User"
    },
    accountVerified:{
        type:Boolean,
        default:false
    },
    borrowedBooks:[{
        bookId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Book" 
        },
        returned:{
            type:Boolean,
            default:false
        },
        bookTitle:String,
        borrowedDate:Date,
        dueDate:Date,
    },
  ],
  avatar:{
    public_id:String,
    url:String, 
  },
  // OTP fields
  verificationOTP: String,
  verificationOTPExpire: Date,
  // Password reset fields
  resetPasswordToken:String,
  resetPasswordExpire:Date,
},
    {
        timestamps:true,
    }
);

userSchema.methods.generateToken = function(){
    return jwt.sign({id:this._id}, process.env.JWT_SECRET_KEY, {
        expiresIn:process.env.JWT_EXPIRE,
    })
};

userSchema.methods.getResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
    
    this.resetPasswordExpire = Date.now() + 15*60*1000; // 15 minutes
    return resetToken;
}

// Generate a 6-digit OTP
userSchema.methods.generateVerificationOTP = function(){
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationOTP = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
    this.verificationOTPExpire = Date.now() + 15*60*1000; // 15 minutes
    return otp;
}

module.exports = mongoose.model("User",userSchema);
