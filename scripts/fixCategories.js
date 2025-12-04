const mongoose = require('mongoose');
const { config } = require('dotenv');
config({ path: './config/config.env' });

mongoose.connect(process.env.MONGO_URI, { dbName: "library_management_system" })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const Book = require('../models/bookModel');

// Accurate categories for famous books
const bookCategoryFixes = {
    "To Kill a Mockingbird": "Fiction",
    "1984": "Fiction",
    "Pride and Prejudice": "Fiction", // Classic Fiction, not just Romance
    "The Great Gatsby": "Fiction",
    "Harry Potter and the Sorcerer's Stone": "Fantasy",
    "The Hobbit": "Fantasy",
    "The Catcher in the Rye": "Fiction",
    "Sapiens: A Brief History of Humankind": "Non-Fiction", // Changed from History to Non-Fiction
    "Educated": "Non-Fiction", // Memoir is Non-Fiction
    "The Da Vinci Code": "Mystery",
    "Atomic Habits": "Self-Help",
    "Thinking, Fast and Slow": "Non-Fiction", // Psychology/Science, not Business
    "A Brief History of Time": "Science",
    "The Lean Startup": "Business",
    "The Alchemist": "Fiction",
    "Steve Jobs": "Biography",
    "The Pragmatic Programmer": "Technology",
    "Clean Code": "Technology",
    "Gone Girl": "Mystery",
    "The 7 Habits of Highly Effective People": "Self-Help"
};

async function fixCategories() {
    try {
        console.log('\n🔄 Fixing book categories...\n');

        const allBooks = await Book.find({});
        console.log(`Found ${allBooks.length} books in database\n`);

        let fixedCount = 0;

        for (const book of allBooks) {
            const correctCategory = bookCategoryFixes[book.title];

            if (correctCategory && book.category !== correctCategory) {
                console.log(`📝 Fixing "${book.title}"`);
                console.log(`   Old: ${book.category} → New: ${correctCategory}`);

                book.category = correctCategory;
                await book.save();
                fixedCount++;
            } else if (correctCategory) {
                console.log(`✓ "${book.title}" - ${book.category} (correct)`);
            } else {
                console.log(`⚠ "${book.title}" - ${book.category} (not in fix list)`);
            }
        }

        console.log(`\n✅ Fixed ${fixedCount} book categories`);

        // Display updated summary
        const categoryCounts = await Book.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log(`\n📊 Updated Category Distribution:`);
        categoryCounts.forEach(cat => {
            console.log(`   ${cat._id}: ${cat.count} books`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

fixCategories();
