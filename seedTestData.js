const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Book = require('./models/Book');
const Transaction = require('./models/Transaction');
const Appointment = require('./models/Appointment');
const Comment = require('./models/Comment');

// Sample data
const sampleUsers = [
  {
    id: 'user_001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '1234567890',
    password: 'password123',
    role: 'user',
    address: '123 Main St, City, State',
    dateOfBirth: new Date('1990-01-15'),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user_002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phoneNumber: '0987654321',
    password: 'password123',
    role: 'admin',
    address: '456 Oak Ave, City, State',
    dateOfBirth: new Date('1985-05-20'),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user_003',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@example.com',
    phoneNumber: '5555555555',
    password: 'password123',
    role: 'user',
    address: '789 Pine Rd, City, State',
    dateOfBirth: new Date('1992-08-10'),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleBooks = [
  {
    id: 'book_001',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0-7432-7356-5',
    category: 'Classic Literature',
    description: 'A classic American novel about the Jazz Age',
    price: 15.99,
    rent: 3.99,
    availability: true,
    image: 'https://example.com/gatsby.jpg',
    language: 'English',
    pages: 180,
    publisher: 'Scribner',
    publicationDate: new Date('1925-04-10'),
    dateAdded: new Date(),
    totalCopies: 5,
    availableCopies: 3,
    comments: []
  },
  {
    id: 'book_002',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0-06-112008-4',
    category: 'Fiction',
    description: 'A gripping tale of racial injustice and childhood innocence',
    price: 14.99,
    rent: 3.50,
    availability: true,
    image: 'https://example.com/mockingbird.jpg',
    language: 'English',
    pages: 281,
    publisher: 'J.B. Lippincott & Co.',
    publicationDate: new Date('1960-07-11'),
    dateAdded: new Date(),
    totalCopies: 4,
    availableCopies: 2,
    comments: []
  },
  {
    id: 'book_003',
    title: '1984',
    author: 'George Orwell',
    isbn: '978-0-452-28423-4',
    category: 'Science Fiction',
    description: 'A dystopian social science fiction novel',
    price: 13.99,
    rent: 2.99,
    availability: true,
    image: 'https://example.com/1984.jpg',
    language: 'English',
    pages: 328,
    publisher: 'Secker & Warburg',
    publicationDate: new Date('1949-06-08'),
    dateAdded: new Date(),
    totalCopies: 6,
    availableCopies: 4,
    comments: []
  },
  {
    id: 'book_004',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    isbn: '978-0-14-143951-8',
    category: 'Romance',
    description: 'A romantic novel of manners',
    price: 12.99,
    rent: 2.50,
    availability: true,
    image: 'https://example.com/pride.jpg',
    language: 'English',
    pages: 432,
    publisher: 'T. Egerton',
    publicationDate: new Date('1813-01-28'),
    dateAdded: new Date(),
    totalCopies: 3,
    availableCopies: 1,
    comments: []
  },
  {
    id: 'book_005',
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    isbn: '978-0-316-76948-0',
    category: 'Coming-of-age',
    description: 'A controversial novel about teenage rebellion',
    price: 16.99,
    rent: 4.25,
    availability: true,
    image: 'https://example.com/catcher.jpg',
    language: 'English',
    pages: 277,
    publisher: 'Little, Brown and Company',
    publicationDate: new Date('1951-07-16'),
    dateAdded: new Date(),
    totalCopies: 2,
    availableCopies: 2,
    comments: []
  }
];

const sampleTransactions = [
  {
    id: 'trans_001',
    userId: 'user_001',
    bookId: 'book_001',
    type: 'borrow',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    totalAmount: 3.99,
    paymentMethod: 'credit_card',
    transactionDate: new Date(),
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'trans_002',
    userId: 'user_002',
    bookId: 'book_002',
    type: 'buy',
    totalAmount: 14.99,
    paymentMethod: 'online',
    transactionDate: new Date(),
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'trans_003',
    userId: 'user_003',
    bookId: 'book_003',
    type: 'borrow',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    totalAmount: 2.99,
    paymentMethod: 'cash',
    transactionDate: new Date(),
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleAppointments = [
  {
    id: 'appt_001',
    userId: 'user_001',
    subject: 'Book Consultation',
    details: 'Need help selecting books for research project',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'appt_002',
    userId: 'user_003',
    subject: 'Library Tour',
    details: 'First-time visitor, need orientation',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'appt_003',
    userId: 'user_001',
    subject: 'Book Return Discussion',
    details: 'Discuss late book return and fees',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleComments = [
  {
    id: 'comment_001',
    userId: 'user_001',
    bookId: 'book_001',
    userName: 'John Doe',
    content: 'Amazing book! The writing style is captivating and the story is timeless.',
    rating: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'comment_002',
    userId: 'user_002',
    bookId: 'book_002',
    userName: 'Jane Smith',
    content: 'A powerful and moving story that everyone should read.',
    rating: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'comment_003',
    userId: 'user_003',
    bookId: 'book_003',
    userName: 'Bob Johnson',
    content: 'Dystopian masterpiece. Very relevant to today\'s world.',
    rating: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'comment_004',
    userId: 'user_001',
    bookId: 'book_004',
    userName: 'John Doe',
    content: 'Classic romance with great character development.',
    rating: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Book.deleteMany({});
    await Transaction.deleteMany({});
    await Appointment.deleteMany({});
    await Comment.deleteMany({});
    console.log('Cleared existing data');

    // Hash passwords for users
    for (let user of sampleUsers) {
      user.password = await bcrypt.hash(user.password, 10);
    }

    // Insert sample data
    await User.insertMany(sampleUsers);
    console.log('✅ Sample users created');

    await Book.insertMany(sampleBooks);
    console.log('✅ Sample books created');

    await Transaction.insertMany(sampleTransactions);
    console.log('✅ Sample transactions created');

    await Appointment.insertMany(sampleAppointments);
    console.log('✅ Sample appointments created');

    await Comment.insertMany(sampleComments);
    console.log('✅ Sample comments created');

    console.log('\n🎉 Test data seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('👤 User: john@example.com / password123');
    console.log('👨‍💼 Admin: jane@example.com / password123');
    console.log('👤 User: bob@example.com / password123');
    
    console.log('\n🔗 Test these endpoints:');
    console.log('GET /api/books - View all books');
    console.log('POST /api/users/login - Login with test credentials');
    console.log('GET /api/users - View all users (requires auth)');
    console.log('GET /api/transactions - View all transactions (requires auth)');
    console.log('GET /api/appointments - View all appointments (requires auth)');
    console.log('GET /api/comments - View all comments (requires auth)');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seed function
seedTestData();
