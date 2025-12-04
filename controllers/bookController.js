const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const Book = require("../models/bookModel.js");
const User = require("../models/userModel.js");
const { ErrorHandler } = require("../middlewares/errorMiddlewares.js");

const addBook = catchAsyncErrors(async (req, res, next) => {
    const { title, author, description, category, price, quantity } = req.body;

    if (!title || !author || !description || !category || !price || !quantity) {
        return next(new ErrorHandler("All fields are required to add a book.", 400));
    }

    const book = await Book.create({
        title,
        author,
        description,
        category,
        price,
        quantity,
        availability: quantity > 0
    });
    res.status(201).json({
        success: true,
        message: "Book added successfully",
        book
    });
});

const updateBook = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const book = await Book.findById(id);

    if (!book) {
        return next(new ErrorHandler("Book not found", 404));
    }

    const { title, author, description, category, price, quantity } = req.body;

    if (title) book.title = title;
    if (author) book.author = author;
    if (description) book.description = description;
    if (category) book.category = category;
    if (price) book.price = price;
    if (quantity !== undefined) {
        book.quantity = quantity;
        book.availability = quantity > 0;
    }

    await book.save();

    res.status(200).json({
        success: true,
        message: "Book updated successfully",
        book,
    });
});

const deleteBook = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const book = await Book.findById(id);

    if (!book) {
        return next(new ErrorHandler("Book not found.", 404));
    }

    await book.deleteOne();
    res.status(200).json({
        success: true,
        message: "Book deleted successfully"
    });
});

const getAllBooks = catchAsyncErrors(async (req, res, next) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', category, search } = req.query;

    // Build filter object
    const filter = {};
    if (category && category !== 'All') {
        filter.category = category;
    }
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { author: { $regex: search, $options: 'i' } }
        ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    // Execute query with pagination
    const books = await Book.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Book.countDocuments(filter);

    res.status(200).json({
        success: true,
        books,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

module.exports = { addBook, updateBook, deleteBook, getAllBooks };