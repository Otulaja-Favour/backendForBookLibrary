const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Book = require('../models/Book');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateUser, validateLogin } = require('../middleware/validation');
const { 
  generateUserId, 
  formatResponse, 
  sanitizeUserData,
  calculateCartTotal 
} = require('../utils/helpers');

const router = express.Router();

// Register user
router.post('/register', validateUser, async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(formatResponse(false, 'User already exists with this email'));
    }

    // Create new user
    const userId = generateUserId();
    const user = new User({
      id: userId,
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role: role || 'user',
      broughtBooks: [],
      borrowedBooks: [],
      transactionHistory: [],
      comments: [],
      appointments: [],
      cart: []
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json(formatResponse(true, 'User registered successfully', {
      user: sanitizeUserData(user),
      token
    }));
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json(formatResponse(false, 'Error registering user'));
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json(formatResponse(false, 'Invalid email or password'));
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json(formatResponse(false, 'Invalid email or password'));
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json(formatResponse(true, 'Login successful', {
      user: sanitizeUserData(user),
      token
    }));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(formatResponse(false, 'Error logging in'));
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    res.json(formatResponse(true, 'Profile retrieved successfully', sanitizeUserData(req.user)));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving profile'));
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    
    const user = await User.findOneAndUpdate(
      { id: req.user.id },
      { firstName, lastName, phoneNumber, updatedAt: new Date() },
      { new: true }
    );

    res.json(formatResponse(true, 'Profile updated successfully', sanitizeUserData(user)));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(formatResponse(false, 'Error updating profile'));
  }
});

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(formatResponse(true, 'Users retrieved successfully', users));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving users'));
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only access their own data unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json(formatResponse(false, 'Access denied'));
    }

    const user = await User.findOne({ id }).select('-password');
    if (!user) {
      return res.status(404).json(formatResponse(false, 'User not found'));
    }

    res.json(formatResponse(true, 'User retrieved successfully', user));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving user'));
  }
});

// Add item to cart
router.post('/cart/add', authMiddleware, async (req, res) => {
  try {
    const { bookId, type } = req.body;

    // Validate type
    if (!['buy', 'borrow'].includes(type)) {
      return res.status(400).json(formatResponse(false, 'Invalid transaction type'));
    }

    // Check if book exists
    const book = await Book.findOne({ id: bookId });
    if (!book) {
      return res.status(404).json(formatResponse(false, 'Book not found'));
    }

    // Check if item already in cart
    const user = await User.findOne({ id: req.user.id });
    const existingItem = user.cart.find(item => item.bookId === bookId && item.type === type);
    
    if (existingItem) {
      return res.status(400).json(formatResponse(false, 'Item already in cart'));
    }

    // Add to cart
    const cartItem = {
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: type === 'buy' ? book.price : book.rent,
      image: book.image,
      type,
      addedAt: new Date()
    };

    user.cart.push(cartItem);
    user.updatedAt = new Date();
    await user.save();

    res.json(formatResponse(true, 'Item added to cart successfully', cartItem));
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json(formatResponse(false, 'Error adding item to cart'));
  }
});

// Remove item from cart
router.delete('/cart/remove/:bookId/:type', authMiddleware, async (req, res) => {
  try {
    const { bookId, type } = req.params;

    const user = await User.findOne({ id: req.user.id });
    user.cart = user.cart.filter(item => !(item.bookId === bookId && item.type === type));
    user.updatedAt = new Date();
    await user.save();

    res.json(formatResponse(true, 'Item removed from cart successfully'));
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json(formatResponse(false, 'Error removing item from cart'));
  }
});

// Get user cart
router.get('/cart/items', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    const books = await Book.find({});
    
    const total = calculateCartTotal(user.cart, books);
    
    res.json(formatResponse(true, 'Cart retrieved successfully', {
      items: user.cart,
      total,
      itemCount: user.cart.length
    }));
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving cart'));
  }
});

// Clear cart
router.delete('/cart/clear', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    user.cart = [];
    user.updatedAt = new Date();
    await user.save();

    res.json(formatResponse(true, 'Cart cleared successfully'));
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json(formatResponse(false, 'Error clearing cart'));
  }
});

module.exports = router;
