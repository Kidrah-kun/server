const { isAuthenticated, isAuthorized } = require("../middlewares/authMiddleware");
const { addBook, updateBook, deleteBook, getAllBooks } = require("../controllers/bookController");
const express = require("express");
const router = express.Router();


router.post("/admin/add", isAuthenticated, isAuthorized("Admin"), addBook);
router.put("/admin/update/:id", isAuthenticated, isAuthorized("Admin"), updateBook);
router.delete("/admin/delete/:id", isAuthenticated, isAuthorized("Admin"), deleteBook);
router.get("/all", isAuthenticated, getAllBooks);


module.exports = router;
