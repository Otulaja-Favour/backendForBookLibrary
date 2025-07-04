const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://your-frontend-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection with better error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI not set - running without database');
      return;
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Continuing without database connection');
    // Don't crash the app - continue without DB
  }
};

connectDB();

// Root route for testing
app.get('/', (req, res) => {
  res.json({
    message: 'Bookstore API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    endpoints: [
      'GET /api/books',
      'POST /api/users/register',
      'POST /api/users/login',
      'GET /api/health'
    ]
  });
});

// API root route
app.get('/api', (req, res) => {
  res.json({
    message: 'API endpoints available',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      books: '/api/books',
      transactions: '/api/transactions',
      appointments: '/api/appointments',
      comments: '/api/comments'
    }
  });
});

// Test data endpoint
app.get('/api/test-data', (req, res) => {
  res.json({
    message: 'Sample data for testing endpoints',
    testCredentials: {
      user: { email: 'john@example.com', password: 'password123' },
      admin: { email: 'jane@example.com', password: 'password123' }
    },
    sampleData: {
      newUser: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phoneNumber: '1111111111',
        password: 'password123',
        role: 'user'
      },
      newBook: {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-1-111-11111-1',
        category: 'Test Category',
        description: 'A book for testing purposes',
        price: 19.99,
        rent: 4.99,
        availability: true,
        language: 'English',
        pages: 200,
        publisher: 'Test Publisher'
      },
      newTransaction: {
        bookId: 'book_001',
        type: 'borrow',
        dueDate: '2025-08-01T00:00:00.000Z',
        totalAmount: 3.99,
        paymentMethod: 'credit_card',
        status: 'completed'
      },
      newAppointment: {
        subject: 'Test Appointment',
        details: 'This is a test appointment',
        date: '2025-07-20T10:00:00.000Z'
      },
      newComment: {
        bookId: 'book_001',
        content: 'This is a test comment for the book',
        rating: 5
      }
    },
    instructions: [
      '1. First login using test credentials',
      '2. Use the returned JWT token in Authorization header',
      '3. Test creating new records using the sample data above',
      '4. Run "npm run seed-test-data" to populate with test data'
    ]
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/comments', commentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 3002;

// Debug environment variables
console.log('=== SERVER STARTUP DEBUG ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET ✅' : 'NOT SET ❌');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✅' : 'NOT SET ❌');
console.log('===============================');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Access your API at: http://localhost:${PORT}/api`);
  console.log(`🌐 Production URL: https://backendforlibrary.onrender.com/api`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});
