const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const purchasedBookSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  pdfUrl: { type: String, required: true },
  purchaseDate: { type: Date, default: Date.now },
  transactionRef: { type: String, required: true },
  type: { type: String, enum: ['bought'], default: 'bought' },
  status: { type: String, enum: ['purchased', 'downloaded'], default: 'purchased' }
});

const borrowedBookSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  pdfUrl: { type: String, required: true },
  borrowDate: { type: Date, default: Date.now },
  returnDate: { type: Date },
  transactionRef: { type: String, required: true },
  type: { type: String, enum: ['borrowed'], default: 'borrowed' },
  status: { type: String, enum: ['active', 'returned', 'overdue'], default: 'active' }
});

const transactionItemSchema = new mongoose.Schema({
  bookId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  type: { type: String, enum: ['buy', 'borrow'], required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }
});

const transactionHistorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  items: [transactionItemSchema],
  date: { type: Date, default: Date.now },
  reference: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  metadata: { type: Object, default: {} }
});

const appointmentSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  details: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'successful'], default: 'pending' },
  userId: { type: String, required: true },
  id: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  bookId: { type: String },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const cartItemSchema = new mongoose.Schema({
  bookId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  type: { type: String, enum: ['buy', 'borrow'], required: true },
  addedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phoneNumber: { type: Number, required: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  broughtBooks: [purchasedBookSchema],
  borrowedBooks: [borrowedBookSchema],
  transactionHistory: [transactionHistorySchema],
  comments: [commentSchema],
  appointments: [appointmentSchema],
  cart: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
