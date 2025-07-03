const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  bookId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  type: { type: String, enum: ['buy', 'borrow'], required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }
});

const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  items: [transactionItemSchema],
  date: { type: Date, default: Date.now },
  reference: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  metadata: { type: Object, default: {} },
  paymentMethod: { type: String, default: 'card' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
