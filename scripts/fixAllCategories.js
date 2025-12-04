const mongoose = require('mongoose');
const { config } = require('dotenv');
config({ path: './config/config.env' });

mongoose.connect(process.env.MONGO_URI, { dbName: "library_management_system" })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const Book = require('../models/bookModel');

// Complete mapping of all books to their correct categories
const bookCategories = {
    // Fiction
    "1984": "Fiction",
    "Pride and Prejudice": "Fiction",
    "Brave New World": "Fiction",
    "Jane Eyre": "Fiction",
    "Animal Farm": "Fiction",
    "To Kill a Mockingbird": "Fiction",
    "The Great Gatsby": "Fiction",
    "The Catcher in the Rye": "Fiction",
    "The Alchemist": "Fiction",

    // Fantasy
    "The Lord of the Rings": "Fantasy",
    "The Chronicles of Narnia": "Fantasy",
    "Harry Potter and the Sorcerer's Stone": "Fantasy",
    "The Hobbit": "Fantasy",

    // Non-Fiction
    "Sapiens: A Brief History of Humankind": "Non-Fiction",
    "Educated": "Non-Fiction",
    "Thinking, Fast and Slow": "Non-Fiction",

    // Technology
    "Learn DSA in 60 days": "Technology",
    "The Pragmatic Programmer": "Technology",
    "Clean Code": "Technology",

    // Mystery
    "The Da Vinci Code": "Mystery",
    "Gone Girl": "Mystery",

    // Self-Help
    "Atomic Habits": "Self-Help",
    "The 7 Habits of Highly Effective People": "Self-Help",

    // Biography
    "Steve Jobs": "Biography",

    // Business
    "The Lean Startup": "Business",

    // Science
    "A Brief History of Time": "Science"
};

async function fixAllCategories() {
    try {
        console.log('\n🔄 Fixing all book categories...\n');

        // Find ALL books with 'Other', null, or missing category
        const booksToFix = await Book.find({
            $or: [
                { category: 'Other' },
                { category: { $exists: false } },
                { category: null },
                { category: '' }
            ]
        });

        console.log(`Found ${booksToFix.length} books with missing or 'Other' category\n`);

        let fixedCount = 0;
        let notFoundCount = 0;

        for (const book of booksToFix) {
            const correctCategory = bookCategories[book.title];

            if (correctCategory) {
                console.log(`📝 Fixing "${book.title}"`);
                console.log(`   ${book.category || 'Missing'} → ${correctCategory}`);

                book.category = correctCategory;
                await book.save();
                fixedCount++;
            } else {
                console.log(`⚠️  "${book.title}" by ${book.author} - not in mapping, setting to Fiction`);
                book.category = 'Fiction'; // Default fallback
                await book.save();
                fixedCount++;
                notFoundCount++;
            }
        }

        console.log(`\n✅ Fixed ${fixedCount} books (${notFoundCount} used default)`);

        // Display final summary
        const categoryCounts = await Book.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log(`\n📊 Final Category Distribution:`);
        categoryCounts.forEach(cat => {
            console.log(`   ${cat._id || 'Missing'}: ${cat.count} books`);
        });

        // Check for any remaining issues
        const stillBroken = await Book.find({
            $or: [
                { category: 'Other' },
                { category: { $exists: false } },
                { category: null }
            ]
        });

        if (stillBroken.length > 0) {
            console.log(`\n⚠️  Still ${stillBroken.length} books with issues:`);
            stillBroken.forEach(book => {
                console.log(`   - "${book.title}" by ${book.author}`);
            });
        } else {
            console.log(`\n✅ All books now have valid categories!`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

fixAllCategories();
