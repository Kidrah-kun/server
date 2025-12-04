const { ErrorHandler } = require("../middlewares/errorMiddlewares.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const Borrow = require("../models/borrowModel");
const Book = require("../models/bookModel");
const User = require("../models/userModel");
const { calculateFine } = require("../utils/fineCalculator.js");

// User-friendly borrow endpoint
const borrowBook = catchAsyncErrors(
    async (req, res, next) => {
        const { bookId } = req.body;
        const userId = req.user._id;

        const book = await Book.findById(bookId);
        if (!book) {
            return next(new ErrorHandler("Book not found", 404));
        }

        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        if (book.quantity < 1) {
            return next(new ErrorHandler("Book is out of stock", 400));
        }

        const isAlreadyBorrowed = user.borrowedBooks.find(
            (b) => b.bookId.toString() === bookId && b.returned === false
        );
        if (isAlreadyBorrowed) {
            return next(new ErrorHandler("You have already borrowed this book", 400));
        }

        book.quantity -= 1;
        book.availability = book.quantity > 0;
        await book.save();

        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now

        user.borrowedBooks.push({
            bookId: book._id,
            bookTitle: book.title,
            borrowedDate: new Date(),
            dueDate: dueDate,
            returned: false,
        });
        await user.save();

        await Borrow.create({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            book: book._id,
            dueDate: dueDate,
            price: book.price,
        });

        res.status(200).json({
            success: true,
            message: "Book borrowed successfully",
        });
    }
);

// Admin endpoint to record borrowed book
const recordBorrowedBook = catchAsyncErrors(
    async (req, res, next) => {
        const { id } = req.params;
        const { email } = req.body;
        const book = await Book.findById(id);

        if (!book) {
            return next(new ErrorHandler("Book not found", 404));
        }
        const user = await User.findOne({ email, role: "User", accountVerified: true });
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        if (book.quantity < 1) {
            return next(new ErrorHandler("Book is out of stock", 400));
        }

        const isAlreadyBorrowed = user.borrowedBooks.find(
            (b) => b.bookId.toString() === id && b.returned === false
        );
        if (isAlreadyBorrowed) {
            return next(new ErrorHandler("User has already borrowed this book", 400));
        }

        book.quantity -= 1;
        book.availability = book.quantity > 0;
        await book.save();

        user.borrowedBooks.push({
            bookId: book._id,
            bookTitle: book.title,
            borrowedDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 weeks from now
            returned: false,
        });
        await user.save();
        await Borrow.create({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },

            book: book._id,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 weeks from now
            price: book.price,

        });
        res.status(200).json({
            success: true,
            message: "Borrowed Book Recorded successfully",
        });
    }
);

// User return book endpoint
const returnBook = catchAsyncErrors(
    async (req, res, next) => {
        const { id } = req.params;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        const borrowedBook = user.borrowedBooks.find(
            (b) => b._id.toString() === id && b.returned === false
        );
        if (!borrowedBook) {
            return next(new ErrorHandler("This book is not borrowed by you", 400));
        }

        const book = await Book.findById(borrowedBook.bookId);
        if (!book) {
            return next(new ErrorHandler("Book not found", 404));
        }

        borrowedBook.returned = true;
        borrowedBook.returnedDate = new Date();
        await user.save();

        book.quantity += 1;
        book.availability = book.quantity > 0;
        await book.save();

        const borrow = await Borrow.findOne({
            book: borrowedBook.bookId,
            "user.id": userId,
            returnDate: null,
        });
        if (borrow) {
            borrow.returnDate = new Date();
            const fine = calculateFine(borrow.dueDate);
            borrow.fine = fine;
            await borrow.save();

            res.status(200).json({
                success: true,
                message: fine > 0 ? `Book returned successfully! Total charges including fine $${fine} and price $${book.price} are $${book.price + fine}.` : `Book returned successfully! Total charges are $${book.price}.`,
            });
        } else {
            res.status(200).json({
                success: true,
                message: "Book returned successfully!",
            });
        }
    }
);

// Admin return book endpoint
const returnBorrowedBook = catchAsyncErrors(
    async (req, res, next) => {
        const { borrowId } = req.params;

        // Find the borrow record
        const borrow = await Borrow.findById(borrowId).populate('book');
        if (!borrow) {
            return next(new ErrorHandler("Borrow record not found", 404));
        }

        if (borrow.returnDate !== null) {
            return next(new ErrorHandler("Book already returned", 400));
        }

        // Update borrow record
        borrow.returnDate = new Date();
        const fine = calculateFine(borrow.dueDate);
        borrow.fine = fine;
        await borrow.save();

        // Update book quantity
        const book = await Book.findById(borrow.book._id);
        if (book) {
            book.quantity += 1;
            book.availability = book.quantity > 0;
            await book.save();
        }

        // Update user's borrowed books
        const user = await User.findById(borrow.user.id);
        if (user) {
            const borrowedBook = user.borrowedBooks.find(
                (b) => b.bookId.toString() === borrow.book._id.toString() && b.returned === false
            );
            if (borrowedBook) {
                borrowedBook.returned = true;
                borrowedBook.returnedDate = new Date();
                await user.save();
            }
        }

        res.status(200).json({
            success: true,
            message: fine > 0
                ? `Book returned successfully! Fine: $${fine}`
                : "Book returned successfully!",
        });
    }
);

const borrowedBooks = catchAsyncErrors(
    async (req, res, next) => {
        const { borrowedBooks } = req.user;
        res.status(200).json({
            success: true,
            borrowedBooks,
        });
    }
);

const getBorrowedBooksForAdmin = catchAsyncErrors(
    async (req, res, next) => {
        const borrowedBooks = await Borrow.find().populate('book', 'title author');

        // Transform data to include book title and user info
        const borrows = borrowedBooks.map(borrow => ({
            _id: borrow._id,
            userName: borrow.user.name,
            userEmail: borrow.user.email,
            userId: borrow.user.id,
            bookTitle: borrow.book?.title || 'Unknown Book',
            bookId: borrow.book?._id,
            borrowedDate: borrow.borrowDate,
            dueDate: borrow.dueDate,
            returnedDate: borrow.returnDate,
            returned: borrow.returnDate !== null,
            fine: borrow.fine || 0,
        }));

        res.status(200).json({
            success: true,
            borrows,
        });
    }
);

module.exports = {
    borrowBook,
    borrowedBooks,
    recordBorrowedBook,
    getBorrowedBooksForAdmin,
    returnBook,
    returnBorrowedBook,
}