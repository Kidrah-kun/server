const express = require("express");
const router = express.Router();
const { getAllUsers, registerNewAdmin, deleteUserByAdmin, deleteOwnAccount } = require("../controllers/userController.js");
const { isAuthenticated, isAuthorized } = require("../middlewares/authMiddleware.js");


router.get("/all", isAuthenticated, isAuthorized("Admin"), getAllUsers);
router.post("/add/new-admin", isAuthenticated, isAuthorized("Admin"), registerNewAdmin);
router.delete("/delete-user/:id", isAuthenticated, isAuthorized("Admin"), deleteUserByAdmin);
router.delete("/delete-account", isAuthenticated, deleteOwnAccount);

module.exports = router;