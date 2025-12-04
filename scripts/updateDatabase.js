const mongoose = require('mongoose');
const { config } = require('dotenv');
config({ path: './config/config.env' });

// Connect to database
mongoose.connect(process.env.MONGO_URI, { dbName: "library_management_system" })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const Book = require('../models/bookModel');

// Famous books to add
const famousBooks = [
    {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        description: "A gripping tale of racial injustice and childhood innocence in the American South.",
        category: "Fiction",
        price: 12.99,
        quantity: 5
    },
    {
        title: "1984",
        author: "George Orwell",
        description: "A dystopian social science fiction novel and cautionary tale about totalitarianism.",
        category: "Fiction",
        price: 14.99,
        quantity: 8
    },
    {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        description: "A tragic love story set in the Jazz Age, exploring themes of decadence and excess.",
        category: "Fiction",
        price: 13.99,
        quantity: 7
    },
    {
        title: "Harry Potter and the Sorcerer's Stone",
        author: "J.K. Rowling",
        description: "A young wizard's journey begins at Hogwarts School of Witchcraft and Wizardry.",
        category: "Fantasy",
        price: 15.99,
        quantity: 10
    },
    {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        description: "A fantasy adventure of Bilbo Baggins' unexpected journey to reclaim a treasure guarded by a dragon.",
        category: "Fantasy",
        price: 14.99,
        quantity: 8
    },
    {
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        description: "A story about teenage rebellion and alienation narrated by Holden Caulfield.",
        category: "Fiction",
        price: 12.99,
        quantity: 5
    },
    // Use only categories allowed by the Book schema enum:
    // ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'Biography',
    //  'Fantasy', 'Mystery', 'Self-Help', 'Business', 'Other']
    {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        description: "A classic novel of manners and social class in 19th-century England.",
        category: "Fiction",
        price: 11.99,
        quantity: 6
    },
    {
        title: "Educated",
        author: "Tara Westover",
        description: "A memoir about a young woman who grows up in a strict and abusive household but eventually escapes to learn about the wider world through education.",
        category: "Non-Fiction",
        price: 16.99,
        quantity: 7
    },
    {
        title: "The Da Vinci Code",
        author: "Dan Brown",
        description: "A mystery thriller following symbologist Robert Langdon as he investigates a murder in the Louvre Museum.",
        category: "Mystery",
        price: 14.99,
        quantity: 9
    },
    {
        title: "Atomic Habits",
        author: "James Clear",
        description: "A practical guide to building good habits and breaking bad ones through tiny changes.",
        category: "Self-Help",
        price: 17.99,
        quantity: 8
    },
    {
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        description: "A landmark volume in science writing exploring cosmology and the nature of time.",
        category: "Science",
        price: 16.99,
        quantity: 6
    },
    {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        description: "An exploration of the two systems that drive the way we think and make decisions.",
        category: "Non-Fiction",
        price: 19.99,
        quantity: 5
    },
    {
        title: "The Lean Startup",
        author: "Eric Ries",
        description: "A methodology for developing businesses and products that aims to shorten product development cycles.",
        category: "Business",
        price: 18.99,
        quantity: 7
    },
    {
        title: "The Alchemist",
        author: "Paulo Coelho",
        description: "A philosophical book about following your dreams and listening to your heart.",
        category: "Fiction",
        price: 13.99,
        quantity: 10
    },
    {
        title: "Steve Jobs",
        author: "Walter Isaacson",
        description: "The exclusive biography of Steve Jobs, based on more than forty interviews with Jobs.",
        category: "Biography",
        price: 19.99,
        quantity: 5
    },
    {
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt and David Thomas",
        description: "A guide to becoming a better programmer through practical advice and anecdotes.",
        category: "Technology",
        price: 22.99,
        quantity: 6
    },
    {
        title: "Clean Code",
        author: "Robert C. Martin",
        description: "A handbook of agile software craftsmanship teaching how to write clean, maintainable code.",
        category: "Technology",
        price: 21.99,
        quantity: 7
    },
    {
        title: "Gone Girl",
        author: "Gillian Flynn",
        description: "A psychological thriller about a woman who goes missing on her fifth wedding anniversary.",
        category: "Mystery",
        price: 15.99,
        quantity: 8
    },
    {
        title: "The 7 Habits of Highly Effective People",
        author: "Stephen R. Covey",
        description: "A self-help book presenting an approach to being effective in attaining goals.",
        category: "Self-Help",
        price: 17.99,
        quantity: 9
    },

    // Extra books to better cover each existing category
    // Fiction
    {
        title: "The Kite Runner",
        author: "Khaled Hosseini",
        description: "A powerful story of friendship, betrayal, and redemption set in Afghanistan and the United States.",
        category: "Fiction",
        price: 14.99,
        quantity: 8
    },
    {
        title: "The Book Thief",
        author: "Markus Zusak",
        description: "A young girl finds solace by stealing books and sharing them with others in Nazi Germany.",
        category: "Fiction",
        price: 13.99,
        quantity: 7
    },

    // Non-Fiction
    {
        title: "Outliers",
        author: "Malcolm Gladwell",
        description: "An examination of the factors that contribute to high levels of success.",
        category: "Non-Fiction",
        price: 16.99,
        quantity: 6
    },
    {
        title: "The Power of Habit",
        author: "Charles Duhigg",
        description: "A look at the science behind why habits exist and how they can be changed.",
        category: "Non-Fiction",
        price: 15.99,
        quantity: 6
    },

    // Science
    {
        title: "The Selfish Gene",
        author: "Richard Dawkins",
        description: "A gene-centered view of evolution and natural selection.",
        category: "Science",
        price: 17.99,
        quantity: 5
    },
    {
        title: "Cosmos",
        author: "Carl Sagan",
        description: "A tour of the universe blending astronomy, philosophy, and history.",
        category: "Science",
        price: 18.99,
        quantity: 5
    },

    // Technology
    {
        title: "Introduction to Algorithms",
        author: "Thomas H. Cormen",
        description: "A comprehensive textbook covering modern algorithms and data structures.",
        category: "Technology",
        price: 29.99,
        quantity: 4
    },
    {
        title: "Design Patterns: Elements of Reusable Object-Oriented Software",
        author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
        description: "The classic catalog of software design patterns.",
        category: "Technology",
        price: 27.99,
        quantity: 4
    },

    // Biography
    {
        title: "Long Walk to Freedom",
        author: "Nelson Mandela",
        description: "The autobiography of Nelson Mandela, chronicling his life and struggle against apartheid.",
        category: "Biography",
        price: 18.99,
        quantity: 5
    },
    {
        title: "Becoming",
        author: "Michelle Obama",
        description: "A memoir by the former First Lady of the United States, reflecting on her life and experiences.",
        category: "Biography",
        price: 19.99,
        quantity: 6
    },

    // Fantasy
    {
        title: "A Game of Thrones",
        author: "George R.R. Martin",
        description: "The first book in the epic fantasy series A Song of Ice and Fire.",
        category: "Fantasy",
        price: 16.99,
        quantity: 7
    },
    {
        title: "The Name of the Wind",
        author: "Patrick Rothfuss",
        description: "The tale of a magically gifted young man who grows to be the most notorious wizard his world has ever seen.",
        category: "Fantasy",
        price: 15.99,
        quantity: 6
    },

    // Mystery
    {
        title: "The Girl with the Dragon Tattoo",
        author: "Stieg Larsson",
        description: "A mystery thriller involving a journalist and a hacker investigating a disappearance.",
        category: "Mystery",
        price: 14.99,
        quantity: 7
    },
    {
        title: "And Then There Were None",
        author: "Agatha Christie",
        description: "Ten strangers are lured to an island and accused of murder in this classic whodunit.",
        category: "Mystery",
        price: 12.99,
        quantity: 8
    },

    // Self-Help
    {
        title: "Deep Work",
        author: "Cal Newport",
        description: "Rules for focused success in a distracted world.",
        category: "Self-Help",
        price: 16.99,
        quantity: 7
    },
    {
        title: "The Subtle Art of Not Giving a F*ck",
        author: "Mark Manson",
        description: "A counterintuitive approach to living a good life.",
        category: "Self-Help",
        price: 15.99,
        quantity: 8
    },

    // Business
    {
        title: "Rich Dad Poor Dad",
        author: "Robert T. Kiyosaki",
        description: "Personal finance lessons contrasting two approaches to money and investing.",
        category: "Business",
        price: 14.99,
        quantity: 8
    },
    {
        title: "Zero to One",
        author: "Peter Thiel",
        description: "Notes on startups, building the future, and creating new things.",
        category: "Business",
        price: 17.99,
        quantity: 6
    },

    // Other
    {
        title: "The Art of War",
        author: "Sun Tzu",
        description: "An ancient Chinese military treatise with lessons still applied today.",
        category: "Other",
        price: 11.99,
        quantity: 6
    },
    {
        title: "Man's Search for Meaning",
        author: "Viktor E. Frankl",
        description: "A psychiatrist's memoir about finding purpose and meaning in the midst of suffering.",
        category: "Other",
        price: 13.99,
        quantity: 6
    }
];

async function updateDatabase() {
    try {
        console.log('\n🔄 Starting database update...\n');

        // Step 1: Add category to existing books that don't have one
        console.log('📚 Step 1: Adding categories to existing books...');
        const booksWithoutCategory = await Book.find({ category: { $exists: false } });
        console.log(`Found ${booksWithoutCategory.length} books without category`);

        for (const book of booksWithoutCategory) {
            // Assign category based on title/author keywords
            let category = 'Other';
            const titleLower = book.title.toLowerCase();

            if (titleLower.includes('harry potter') || titleLower.includes('hobbit') || titleLower.includes('lord of the rings')) {
                category = 'Fantasy';
            } else if (titleLower.includes('science') || titleLower.includes('physics') || titleLower.includes('chemistry')) {
                category = 'Science';
            } else if (titleLower.includes('programming') || titleLower.includes('code') || titleLower.includes('software')) {
                category = 'Technology';
            } else if (titleLower.includes('history')) {
                category = 'History';
            } else if (titleLower.includes('business') || titleLower.includes('startup') || titleLower.includes('entrepreneur')) {
                category = 'Business';
            } else if (titleLower.includes('mystery') || titleLower.includes('detective')) {
                category = 'Mystery';
            } else if (titleLower.includes('romance') || titleLower.includes('love')) {
                category = 'Romance';
            } else if (titleLower.includes('self-help') || titleLower.includes('habits') || titleLower.includes('effective')) {
                category = 'Self-Help';
            } else if (book.author && (book.author.toLowerCase().includes('biography') || titleLower.includes('life of'))) {
                category = 'Biography';
            } else {
                category = 'Fiction';
            }

            book.category = category;
            await book.save();
            console.log(`  ✓ Updated "${book.title}" → ${category}`);
        }

        // Step 2: Add famous books
        console.log('\n📖 Step 2: Adding famous books...');
        let addedCount = 0;
        let skippedCount = 0;

        for (const bookData of famousBooks) {
            // Check if book already exists
            const exists = await Book.findOne({ title: bookData.title, author: bookData.author });

            if (exists) {
                console.log(`  ⊘ Skipped "${bookData.title}" (already exists)`);
                skippedCount++;
                continue;
            }

            const book = await Book.create(bookData);
            console.log(`  ✓ Added "${book.title}" by ${book.author} (${book.category})`);
            addedCount++;
        }

        console.log(`\n✅ Database update complete!`);
        console.log(`   - Updated ${booksWithoutCategory.length} existing books with categories`);
        console.log(`   - Added ${addedCount} new famous books`);
        console.log(`   - Skipped ${skippedCount} duplicate books`);

        // Display summary
        const totalBooks = await Book.countDocuments();
        const categoryCounts = await Book.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log(`\n📊 Database Summary:`);
        console.log(`   Total Books: ${totalBooks}`);
        console.log(`\n   Books by Category:`);
        categoryCounts.forEach(cat => {
            console.log(`   - ${cat._id}: ${cat.count}`);
        });

    } catch (error) {
        console.error('❌ Error updating database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the update
updateDatabase();
