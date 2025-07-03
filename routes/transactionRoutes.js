const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Book = require('../models/Book');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateTransaction } = require('../middleware/validation');
const {
  generateTransactionId,
  generateTransactionReference,
  formatResponse
} = require('../utils/helpers');

const router = express.Router();

// Create new transaction (checkout)
router.post('/checkout', authMiddleware, validateTransaction, async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate all books exist and calculate total
    let totalAmount = 0;
    const transactionItems = [];

    for (const item of items) {
      const book = await Book.findOne({ id: item.bookId });
      if (!book) {
        return res.status(404).json(formatResponse(false, `Book with ID ${item.bookId} not found`));
      }

      // Check availability for borrowing
      if (item.type === 'borrow' && book.availableCopies <= 0) {
        return res.status(400).json(formatResponse(false, `Book "${book.title}" is not available for borrowing`));
      }

      const price = item.type === 'buy' ? book.price : book.rent;
      totalAmount += price;

      transactionItems.push({
        bookId: book.id,
        title: book.title,
        author: book.author,
        type: item.type,
        price,
        image: book.image
      });
    }

    // Create transaction
    const transactionId = generateTransactionId();
    const reference = generateTransactionReference(userId);

    const transaction = new Transaction({
      id: transactionId,
      userId,
      totalAmount,
      items: transactionItems,
      date: new Date(),
      reference,
      status: 'completed', // In a real app, this would be 'pending' until payment is confirmed
      metadata: {},
      paymentMethod: paymentMethod || 'card'
    });

    await transaction.save();

    // Update user's transaction history and books
    const user = await User.findOne({ id: userId });
    
    // Add to transaction history
    user.transactionHistory.push({
      id: transactionId,
      userId,
      totalAmount,
      items: transactionItems,
      date: new Date(),
      reference,
      status: 'completed',
      metadata: {}
    });

    // Process each item
    for (const item of transactionItems) {
      if (item.type === 'buy') {
        // Add to brought books
        user.broughtBooks.push({
          id: item.bookId,
          title: item.title,
          author: item.author,
          image: item.image,
          price: item.price,
          pdfUrl: await Book.findOne({ id: item.bookId }).then(book => book.pdfUrl),
          purchaseDate: new Date(),
          transactionRef: reference,
          type: 'bought',
          status: 'purchased'
        });
      } else if (item.type === 'borrow') {
        // Add to borrowed books
        const borrowDate = new Date();
        const returnDate = new Date(borrowDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days later

        user.borrowedBooks.push({
          id: item.bookId,
          title: item.title,
          author: item.author,
          image: item.image,
          price: item.price,
          pdfUrl: await Book.findOne({ id: item.bookId }).then(book => book.pdfUrl),
          borrowDate,
          returnDate,
          transactionRef: reference,
          type: 'borrowed',
          status: 'active'
        });

        // Update book availability
        await Book.findOneAndUpdate(
          { id: item.bookId },
          { $inc: { availableCopies: -1 } }
        );
      }
    }

    // Clear cart after successful transaction
    user.cart = [];
    user.updatedAt = new Date();
    await user.save();

    res.status(201).json(formatResponse(true, 'Transaction completed successfully', {
      transaction,
      reference,
      totalAmount
    }));
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json(formatResponse(false, 'Error processing transaction'));
  }
});

// Get all transactions (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (userId) query.userId = userId;

    const skip = (page - 1) * limit;
    const transactions = await Transaction.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await Transaction.countDocuments(query);

    res.json(formatResponse(true, 'Transactions retrieved successfully', {
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTransactions: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }));
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving transactions'));
  }
});

// Get user's transactions
router.get('/my-transactions', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const skip = (page - 1) * limit;
    const transactions = await Transaction.find({ userId })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await Transaction.countDocuments({ userId });

    res.json(formatResponse(true, 'Your transactions retrieved successfully', {
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTransactions: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }));
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving your transactions'));
  }
});

// Get transaction by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({ id });

    if (!transaction) {
      return res.status(404).json(formatResponse(false, 'Transaction not found'));
    }

    // Users can only view their own transactions unless they're admin
    if (req.user.role !== 'admin' && transaction.userId !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'Access denied'));
    }

    res.json(formatResponse(true, 'Transaction retrieved successfully', transaction));
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving transaction'));
  }
});

// Update transaction status (admin only)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'failed'].includes(status)) {
      return res.status(400).json(formatResponse(false, 'Invalid status value'));
    }

    const transaction = await Transaction.findOneAndUpdate(
      { id },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json(formatResponse(false, 'Transaction not found'));
    }

    // Also update in user's transaction history
    await User.updateOne(
      { id: transaction.userId, 'transactionHistory.id': id },
      { $set: { 'transactionHistory.$.status': status } }
    );

    res.json(formatResponse(true, 'Transaction status updated successfully', transaction));
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json(formatResponse(false, 'Error updating transaction status'));
  }
});

// Return borrowed book
router.post('/return-book', authMiddleware, async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    if (!bookId) {
      return res.status(400).json(formatResponse(false, 'Book ID is required'));
    }

    const user = await User.findOne({ id: userId });
    const borrowedBook = user.borrowedBooks.find(
      book => book.id === bookId && book.status === 'active'
    );

    if (!borrowedBook) {
      return res.status(404).json(formatResponse(false, 'Active borrowed book not found'));
    }

    // Update borrowed book status
    borrowedBook.status = 'returned';
    borrowedBook.actualReturnDate = new Date();

    // Update book availability
    await Book.findOneAndUpdate(
      { id: bookId },
      { $inc: { availableCopies: 1 } }
    );

    user.updatedAt = new Date();
    await user.save();

    res.json(formatResponse(true, 'Book returned successfully', {
      bookId,
      returnDate: borrowedBook.actualReturnDate
    }));
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json(formatResponse(false, 'Error returning book'));
  }
});

// Get transaction statistics (admin only)
router.get('/stats/overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments();
    const completedTransactions = await Transaction.countDocuments({ status: 'completed' });
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
    const failedTransactions = await Transaction.countDocuments({ status: 'failed' });

    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    // Recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ date: -1 })
      .limit(5);

    res.json(formatResponse(true, 'Transaction statistics retrieved successfully', {
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      totalRevenue: revenue,
      recentTransactions
    }));
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json(formatResponse(false, 'Error retrieving transaction statistics'));
  }
});

module.exports = router;
