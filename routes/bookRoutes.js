const express = require('express');
const Book = require('../models/Book');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateBook } = require('../middleware/validation');
const { generateBookId, formatResponse } = require('../utils/helpers');

const router = express.Router();

// Get all books
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const query = {};

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const books = await Book.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ dateAdded: -1 });

    const total = await Book.countDocuments(query);

    res.json(formatResponse(true, 'Books retrieved successfully', {
      books,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBooks: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }));
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving books'));
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findOne({ id });
    
    if (!book) {
      return res.status(404).json(formatResponse(false, 'Book not found'));
    }

    res.json(formatResponse(true, 'Book retrieved successfully', book));
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving book'));
  }
});

// Add new book (admin only)
router.post('/', authMiddleware, adminMiddleware, validateBook, async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      price,
      image,
      rent,
      pdfUrl,
      category,
      totalCopies
    } = req.body;

    const bookId = generateBookId();
    const book = new Book({
      id: bookId,
      title,
      author,
      description,
      price,
      image,
      rent,
      pdfUrl,
      dateAdded: new Date(),
      category: category || 'General',
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1,
      comments: []
    });

    await book.save();

    res.status(201).json(formatResponse(true, 'Book added successfully', book));
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json(formatResponse(false, 'Error adding book'));
  }
});

// Update book (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const book = await Book.findOneAndUpdate(
      { id },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!book) {
      return res.status(404).json(formatResponse(false, 'Book not found'));
    }

    res.json(formatResponse(true, 'Book updated successfully', book));
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json(formatResponse(false, 'Error updating book'));
  }
});

// Delete book (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findOneAndDelete({ id });
    if (!book) {
      return res.status(404).json(formatResponse(false, 'Book not found'));
    }

    res.json(formatResponse(true, 'Book deleted successfully'));
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json(formatResponse(false, 'Error deleting book'));
  }
});

// Add comment to book
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, rating } = req.body;

    if (!content || content.trim().length < 5) {
      return res.status(400).json(formatResponse(false, 'Comment must be at least 5 characters long'));
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json(formatResponse(false, 'Rating must be between 1 and 5'));
    }

    const book = await Book.findOne({ id });
    if (!book) {
      return res.status(404).json(formatResponse(false, 'Book not found'));
    }

    // Check if user already commented on this book
    const existingComment = book.comments.find(comment => comment.userId === req.user.id);
    if (existingComment) {
      return res.status(400).json(formatResponse(false, 'You have already commented on this book'));
    }

    const comment = {
      id: `comment_${Date.now()}`,
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      content: content.trim(),
      rating: rating || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    book.comments.push(comment);
    await book.save();

    // Also add to user's comments
    const user = await User.findOne({ id: req.user.id });
    user.comments.push({
      ...comment,
      bookId: book.id
    });
    user.updatedAt = new Date();
    await user.save();

    res.status(201).json(formatResponse(true, 'Comment added successfully', comment));
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json(formatResponse(false, 'Error adding comment'));
  }
});

// Get book comments
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findOne({ id });
    
    if (!book) {
      return res.status(404).json(formatResponse(false, 'Book not found'));
    }

    res.json(formatResponse(true, 'Comments retrieved successfully', {
      comments: book.comments,
      totalComments: book.comments.length,
      averageRating: book.averageRating
    }));
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving comments'));
  }
});

// Get book categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Book.distinct('category');
    res.json(formatResponse(true, 'Categories retrieved successfully', categories));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving categories'));
  }
});

// Get popular books (most commented/highest rated)
router.get('/meta/popular', async (req, res) => {
  try {
    const books = await Book.find({})
      .sort({ 'comments.length': -1 })
      .limit(10);

    res.json(formatResponse(true, 'Popular books retrieved successfully', books));
  } catch (error) {
    console.error('Get popular books error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving popular books'));
  }
});

module.exports = router;
