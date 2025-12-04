const express = require("express");
const {
        borrowBook,
        borrowedBooks,
        recordBorrowedBook,
        getBorrowedBooksForAdmin,
        returnBook,
        returnBorrowedBook,
} = require("../controllers/borrowController");
const { isAuthenticated, isAuthorized } = require("../middlewares/authMiddleware.js");

const router = express.Router();

// User endpoints
router.post("/borrow-book", isAuthenticated, borrowBook);
router.get("/my-borrowed-books", isAuthenticated, borrowedBooks);
router.put("/return-book/:id", isAuthenticated, returnBook);

// Admin endpoints
router.post("/record-borrow-book/:id",
        isAuthenticated, isAuthorized("Admin"),
        recordBorrowedBook);

router.get("/borrowed-books-by-users",
        isAuthenticated, isAuthorized("Admin"),
        getBorrowedBooksForAdmin);

router.put("/return-borrowed-book/:borrowId",
        isAuthenticated, isAuthorized("Admin"),
        returnBorrowedBook);

module.exports = router;