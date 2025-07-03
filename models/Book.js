const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const bookSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, required: true },
  rent: { type: Number, required: true, min: 0 },
  pdfUrl: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now },
  comments: [commentSchema],
  category: { type: String, default: 'General' },
  isAvailable: { type: Boolean, default: true },
  totalCopies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 }
}, {
  timestamps: true
});

// Calculate average rating
bookSchema.virtual('averageRating').get(function() {
  if (this.comments.length === 0) return 0;
  const totalRating = this.comments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
  return (totalRating / this.comments.length).toFixed(1);
});

// Include virtuals in JSON output
bookSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);
