# Bookstore/Library API Documentation

## Base URL
```
http://localhost:3002/api
```

## Authentication
This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Quick Start

### 1. Register a new user
```bash
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

### 2. Login to get JWT token
```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```
Response will include a `token` field - use this as your API key.

### 3. Use the token for authenticated requests
```bash
GET /api/users
Authorization: Bearer YOUR_JWT_TOKEN
```

## API Endpoints

### Users
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users` - Get all users (requires auth)
- `GET /api/users/:id` - Get user by ID (requires auth)
- `PUT /api/users/:id` - Update user (requires auth)
- `DELETE /api/users/:id` - Delete user (requires auth)

### Books
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create new book (requires auth)
- `PUT /api/books/:id` - Update book (requires auth)
- `DELETE /api/books/:id` - Delete book (requires auth)

### Transactions
- `GET /api/transactions` - Get all transactions (requires auth)
- `GET /api/transactions/:id` - Get transaction by ID (requires auth)
- `POST /api/transactions` - Create new transaction (requires auth)
- `PUT /api/transactions/:id` - Update transaction (requires auth)
- `DELETE /api/transactions/:id` - Delete transaction (requires auth)

### Appointments
- `GET /api/appointments` - Get all appointments (requires auth)
- `GET /api/appointments/:id` - Get appointment by ID (requires auth)
- `POST /api/appointments` - Create new appointment (requires auth)
- `PUT /api/appointments/:id` - Update appointment (requires auth)
- `DELETE /api/appointments/:id` - Delete appointment (requires auth)

### Comments
- `GET /api/comments` - Get all comments (requires auth)
- `GET /api/comments/:id` - Get comment by ID (requires auth)
- `POST /api/comments` - Create new comment (requires auth)
- `PUT /api/comments/:id` - Update comment (requires auth)
- `DELETE /api/comments/:id` - Delete comment (requires auth)

## Data Models

### User
```json
{
  "name": "String (required)",
  "email": "String (required, unique)",
  "password": "String (required, min 6 chars)",
  "role": "String (enum: user, admin, librarian)",
  "isActive": "Boolean (default: true)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Book
```json
{
  "title": "String (required)",
  "author": "String (required)",
  "isbn": "String (required, unique)",
  "genre": "String",
  "publishedYear": "Number",
  "totalCopies": "Number (default: 1)",
  "availableCopies": "Number (default: 1)",
  "description": "String",
  "price": "Number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Transaction
```json
{
  "user": "ObjectId (ref: User, required)",
  "book": "ObjectId (ref: Book, required)",
  "type": "String (enum: borrow, return, purchase)",
  "status": "String (enum: pending, completed, overdue)",
  "borrowDate": "Date",
  "dueDate": "Date",
  "returnDate": "Date",
  "fine": "Number (default: 0)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Appointment
```json
{
  "user": "ObjectId (ref: User, required)",
  "type": "String (enum: consultation, book_pickup, return)",
  "date": "Date (required)",
  "time": "String (required)",
  "status": "String (enum: scheduled, confirmed, completed, cancelled)",
  "notes": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Comment
```json
{
  "user": "ObjectId (ref: User, required)",
  "book": "ObjectId (ref: Book, required)",
  "rating": "Number (min: 1, max: 5, required)",
  "comment": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Error Responses
All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (in development)"
}
```

## Success Responses
All endpoints return success responses in this format:
```json
{
  "success": true,
  "data": "Response data",
  "message": "Optional success message"
}
```
