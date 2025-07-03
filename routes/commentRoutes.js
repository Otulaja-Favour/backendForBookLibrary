const express = require('express');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Book = require('../models/Book');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateComment } = require('../middleware/validation');
const { generateCommentId, formatResponse } = require('../utils/helpers');

const router = express.Router();

// Create new comment
router.post('/', authMiddleware, validateComment, async (req, res) => {
  try {
    const { bookId, content, rating } = req.body;
    const userId = req.user.id;

    // Validate book exists if bookId is provided
    if (bookId) {
      const book = await Book.findOne({ id: bookId });
      if (!book) {
        return res.status(404).json(formatResponse(false, 'Book not found'));
      }
    }

    const commentId = generateCommentId();
    const userName = `${req.user.firstName} ${req.user.lastName}`;

    const comment = new Comment({
      id: commentId,
      userId,
      bookId: bookId || null,
      userName,
      content: content.trim(),
      rating: rating || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await comment.save();

    // Add to user's comments
    const user = await User.findOne({ id: userId });
    user.comments.push({
      id: commentId,
      userId,
      bookId: bookId || null,
      content: content.trim(),
      rating: rating || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    user.updatedAt = new Date();
    await user.save();

    // If it's a book comment, add to book's comments
    if (bookId) {
      const book = await Book.findOne({ id: bookId });
      book.comments.push({
        id: commentId,
        userId,
        userName,
        content: content.trim(),
        rating: rating || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await book.save();
    }

    res.status(201).json(formatResponse(true, 'Comment created successfully', comment));
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json(formatResponse(false, 'Error creating comment'));
  }
});

// Get all comments (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, bookId, userId } = req.query;
    const query = {};

    if (bookId) query.bookId = bookId;
    if (userId) query.userId = userId;

    const skip = (page - 1) * limit;
    const comments = await Comment.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Comment.countDocuments(query);

    res.json(formatResponse(true, 'Comments retrieved successfully', {
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }));
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving comments'));
  }
});

// Get user's comments
router.get('/my-comments', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const skip = (page - 1) * limit;
    const comments = await Comment.find({ userId })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Comment.countDocuments({ userId });

    res.json(formatResponse(true, 'Your comments retrieved successfully', {
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }));
  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving your comments'));
  }
});

// Get comment by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findOne({ id });

    if (!comment) {
      return res.status(404).json(formatResponse(false, 'Comment not found'));
    }

    res.json(formatResponse(true, 'Comment retrieved successfully', comment));
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving comment'));
  }
});

// Update comment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, rating } = req.body;

    const comment = await Comment.findOne({ id });
    if (!comment) {
      return res.status(404).json(formatResponse(false, 'Comment not found'));
    }

    // Users can only update their own comments
    if (comment.userId !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'Access denied'));
    }

    // Update comment
    if (content) comment.content = content.trim();
    if (rating !== undefined) comment.rating = rating;
    comment.updatedAt = new Date();

    await comment.save();

    // Update in user's comments array
    const user = await User.findOne({ id: comment.userId });
    const userCommentIndex = user.comments.findIndex(c => c.id === id);
    if (userCommentIndex !== -1) {
      user.comments[userCommentIndex].content = comment.content;
      user.comments[userCommentIndex].rating = comment.rating;
      user.comments[userCommentIndex].updatedAt = comment.updatedAt;
      user.updatedAt = new Date();
      await user.save();
    }

    // Update in book's comments array if it's a book comment
    if (comment.bookId) {
      const book = await Book.findOne({ id: comment.bookId });
      if (book) {
        const bookCommentIndex = book.comments.findIndex(c => c.id === id);
        if (bookCommentIndex !== -1) {
          book.comments[bookCommentIndex].content = comment.content;
          book.comments[bookCommentIndex].rating = comment.rating;
          book.comments[bookCommentIndex].updatedAt = comment.updatedAt;
          await book.save();
        }
      }
    }

    res.json(formatResponse(true, 'Comment updated successfully', comment));
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json(formatResponse(false, 'Error updating comment'));
  }
});

// Delete comment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findOne({ id });
    if (!comment) {
      return res.status(404).json(formatResponse(false, 'Comment not found'));
    }

    // Users can only delete their own comments unless they're admin
    if (req.user.role !== 'admin' && comment.userId !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'Access denied'));
    }

    await Comment.findOneAndDelete({ id });

    // Remove from user's comments array
    const user = await User.findOne({ id: comment.userId });
    user.comments = user.comments.filter(c => c.id !== id);
    user.updatedAt = new Date();
    await user.save();

    // Remove from book's comments array if it's a book comment
    if (comment.bookId) {
      const book = await Book.findOne({ id: comment.bookId });
      if (book) {
        book.comments = book.comments.filter(c => c.id !== id);
        await book.save();
      }
    }

    res.json(formatResponse(true, 'Comment deleted successfully'));
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json(formatResponse(false, 'Error deleting comment'));
  }
});

module.exports = router;
