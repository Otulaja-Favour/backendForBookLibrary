const generateId = (prefix = '') => {
  return `${prefix}${prefix ? '_' : ''}${Date.now()}`;
};

const generateTransactionReference = (userId) => {
  return `ORDER_${Date.now()}_${userId}`;
};

const generateAppointmentId = (userId) => {
  return `apt_${userId}_${Date.now()}`;
};

const generateTransactionId = () => {
  return `tx_${Date.now()}`;
};

const generateUserId = () => {
  return `user_${Date.now()}`;
};

const generateBookId = () => {
  return `${Math.floor(Math.random() * 1000)}_${Math.floor(Math.random() * 100)}`;
};

const generateCommentId = () => {
  return `comment_${Date.now()}`;
};

const formatResponse = (success, message, data = null) => {
  const response = { success, message };
  if (data !== null) {
    response.data = data;
  }
  return response;
};

const calculateCartTotal = (cartItems, books) => {
  return cartItems.reduce((total, item) => {
    const book = books.find(b => b.id === item.bookId);
    if (book) {
      const price = item.type === 'buy' ? book.price : book.rent;
      return total + price;
    }
    return total;
  }, 0);
};

const sanitizeUserData = (user) => {
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

module.exports = {
  generateId,
  generateTransactionReference,
  generateAppointmentId,
  generateTransactionId,
  generateUserId,
  generateBookId,
  generateCommentId,
  formatResponse,
  calculateCartTotal,
  sanitizeUserData
};
