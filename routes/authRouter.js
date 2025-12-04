const express = require("express");
const { register, verifyOTP, login, logout , getUser, forgotPassword, resetPassword, updatePassword } = require("../controllers/authController.js");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/authMiddleware.js");

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.get("/logout", isAuthenticated,logout);
router.get("/me", isAuthenticated,getUser);
router.post("/password/forget", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.put("/password/update", isAuthenticated, updatePassword);

module.exports = router;