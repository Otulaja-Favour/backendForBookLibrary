const mongoose = require('mongoose');
const User = require('./models/User');
const Book = require('./models/Book');
const Transaction = require('./models/Transaction');
const Appointment = require('./models/Appointment');
const Comment = require('./models/Comment');
require('dotenv').config();

// Sample data based on your JSON structure
const sampleData = {
  users: [
    {
      id: "user_1751091168293",
      firstName: "otulaja",
      lastName: "favour",
      email: "otulajafavour14@gmail.com",
      phoneNumber: 9151596279,
      password: "123456",
      role: "user"
    }
  ],
  books: [
    {
      id: "1_0",
      title: "Prepare discussion large.",
      author: "Marissa Williams",
      description: "Big compare you major save. System nothing long eat bring language direction.\nReport off account per this peace indeed. Full than stock door behavior simple.",
      price: 4029,
      image: "https://placekitten.com/310/391",
      rent: 952,
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      dateAdded: "2025-06-29",
      category: "General"
    }
  ],
  transactions: [
    {
      id: "tx_1751373046219",
      userId: "user_1751091168293",
      totalAmount: 952,
      items: [
        {
          bookId: "1_0",
          title: "Prepare discussion large.",
          author: "Marissa Williams",
          type: "borrow",
          price: 952,
          image: "https://placekitten.com/310/391"
        }
      ],
      date: "2025-07-01T12:30:46.219Z",
      reference: "ORDER_1751373032558_user_1751091168293",
      status: "completed"
    },
    {
      id: "tx_1751373339214",
      userId: "user_1751091168293",
      totalAmount: 4029,
      items: [
        {
          bookId: "1_0",
          title: "Prepare discussion large.",
          author: "Marissa Williams",
          type: "buy",
          price: 4029,
          image: "https://placekitten.com/310/391"
        }
      ],
      date: "2025-07-01T12:35:39.214Z",
      reference: "ORDER_1751373332565_user_1751091168293",
      status: "completed"
    }
  ],
  appointments: [
    {
      id: "apt_user_1751091168293_1751205584647",
      subject: "tyuio",
      details: "fyui",
      date: "2025-06-29T13:59:00.000Z",
      status: "successful",
      userId: "user_1751091168293",
      createdAt: "2025-06-29T13:59:44.647Z"
    }
  ]
};

async function seedDatabase() {
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

    // Create books first
    const books = await Book.insertMany(sampleData.books.map(book => ({
      ...book,
      dateAdded: new Date(book.dateAdded),
      comments: []
    })));
    console.log(`Created ${books.length} books`);

    // Create users with embedded data
    const users = await User.insertMany(sampleData.users.map(user => ({
      ...user,
      broughtBooks: [
        {
          id: "1_0",
          title: "Prepare discussion large.",
          author: "Marissa Williams",
          image: "https://placekitten.com/310/391",
          price: 4029,
          pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          purchaseDate: new Date("2025-07-01T12:35:39.214Z"),
          transactionRef: "ORDER_1751373332565_user_1751091168293",
          type: "bought",
          status: "purchased"
        }
      ],
      borrowedBooks: [],
      transactionHistory: sampleData.transactions.map(tx => ({
        ...tx,
        date: new Date(tx.date),
        metadata: {}
      })),
      comments: [],
      appointments: sampleData.appointments.map(apt => ({
        ...apt,
        date: new Date(apt.date),
        createdAt: new Date(apt.createdAt)
      })),
      cart: [],
      updatedAt: new Date("2025-07-01T12:35:40.546Z")
    })));
    console.log(`Created ${users.length} users`);

    // Create transactions
    const transactions = await Transaction.insertMany(sampleData.transactions.map(tx => ({
      ...tx,
      date: new Date(tx.date),
      metadata: {}
    })));
    console.log(`Created ${transactions.length} transactions`);

    // Create appointments
    const appointments = await Appointment.insertMany(sampleData.appointments.map(apt => ({
      ...apt,
      date: new Date(apt.date),
      createdAt: new Date(apt.createdAt),
      updatedAt: new Date(apt.createdAt)
    })));
    console.log(`Created ${appointments.length} appointments`);

    console.log('Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
