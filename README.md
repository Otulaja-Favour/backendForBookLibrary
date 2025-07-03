# Bookstore Backend API

A complete Node.js/Express/MongoDB backend for a bookstore/library management system.

## Features

- 🔐 JWT Authentication
- 📚 Book Management
- 👥 User Management
- 💳 Transaction Handling
- 📅 Appointment Scheduling
- 💬 Comment System
- 🛡️ Security Middleware
- ✅ Input Validation

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user

### Books
- `GET /api/books` - Get all books
- `POST /api/books` - Create new book
- `GET /api/books/:id` - Get book by ID
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Comments
- `GET /api/comments` - Get all comments
- `POST /api/comments` - Create comment
- `GET /api/comments/:id` - Get comment by ID
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

## Environment Variables

```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/bookstore
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## Installation

```bash
npm install
npm start
```

## Usage

1. Register a new user: `POST /api/users/register`
2. Login to get JWT token: `POST /api/users/login`
3. Use the token in Authorization header: `Bearer your-token`
4. Make authenticated requests to protected endpoints

## Deployment

Ready for deployment on Render, Heroku, or any Node.js hosting platform.

## License

ISC
