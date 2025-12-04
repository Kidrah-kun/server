const mongoose = require('mongoose');
const { config } = require('dotenv');
config({ path: './config/config.env' });

mongoose.connect(process.env.MONGO_URI, { dbName: "library_management_system" })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const Book = require('../models/bookModel');

// Map of books that need category updates
const bookCategories = {
    "Jane Eyre": "Fiction",
    "Animal Farm": "Fiction",
    "The Lord of the Rings": "Fantasy",
    "The Chronicles of Narnia": "Fantasy",
    "Jane Eyre": "Fiction",
    "Animal Farm": "Fiction",
    "The Lord of the Rings": "Fantasy"
};

async function fixOtherCategories() {
    try {
        console.log('\n🔄 Fixing books with "Other" category...\n');

        // Find all books with 'Other' category
        const otherBooks = await Book.find({ category: 'Other' });
        console.log(`Found ${otherBooks.length} books with "Other" category\n`);

        let fixedCount = 0;

        for (const book of otherBooks) {
            const correctCategory = bookCategories[book.title];

            if (correctCategory) {
                console.log(`📝 Fixing "${book.title}" by ${book.author}`);
                console.log(`   Other → ${correctCategory}`);

                book.category = correctCategory;
                await book.save();
                fixedCount++;
            } else {
                console.log(`⚠️  "${book.title}" by ${book.author} - needs manual categorization`);
                console.log(`   Current: Other`);
            }
        }

        console.log(`\n✅ Fixed ${fixedCount} books`);

        // Display final summary
        const categoryCounts = await Book.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log(`\n📊 Updated Category Distribution:`);
        categoryCounts.forEach(cat => {
            console.log(`   ${cat._id}: ${cat.count} books`);
        });

        // Show remaining 'Other' books
        const remainingOther = await Book.find({ category: 'Other' }, { title: 1, author: 1 });
        if (remainingOther.length > 0) {
            console.log(`\n⚠️  Books still in "Other" category:`);
            remainingOther.forEach(book => {
                console.log(`   - "${book.title}" by ${book.author}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

fixOtherCategories();
