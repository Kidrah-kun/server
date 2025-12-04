const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: [true, "Please provide book category"],
        enum: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'Biography', 'Fantasy', 'Mystery', 'Self-Help', 'Business', 'Other'],
        default: 'Other'
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    availability: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Book', bookSchema);