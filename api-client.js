// API Test Client for Bookstore/Library Backend
// This file demonstrates how to use the API from another project

// Auto-detect environment
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 
    'https://your-app-name.onrender.com/api' : 
    'http://localhost:3002/api';

class BookstoreAPIClient {
    constructor() {
        this.token = null;
        this.baseURL = API_BASE_URL;
    }

    // Set the JWT token for authenticated requests
    setToken(token) {
        this.token = token;
    }

    // Make HTTP requests
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add authorization header if token is available
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Authentication methods
    async register(userData) {
        return this.makeRequest('/users/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(email, password) {
        const response = await this.makeRequest('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.success && response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    // User methods
    async getUsers() {
        return this.makeRequest('/users');
    }

    async getUser(id) {
        return this.makeRequest(`/users/${id}`);
    }

    async updateUser(id, userData) {
        return this.makeRequest(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return this.makeRequest(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Book methods
    async getBooks() {
        return this.makeRequest('/books');
    }

    async getBook(id) {
        return this.makeRequest(`/books/${id}`);
    }

    async createBook(bookData) {
        return this.makeRequest('/books', {
            method: 'POST',
            body: JSON.stringify(bookData)
        });
    }

    async updateBook(id, bookData) {
        return this.makeRequest(`/books/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bookData)
        });
    }

    async deleteBook(id) {
        return this.makeRequest(`/books/${id}`, {
            method: 'DELETE'
        });
    }

    // Transaction methods
    async getTransactions() {
        return this.makeRequest('/transactions');
    }

    async getTransaction(id) {
        return this.makeRequest(`/transactions/${id}`);
    }

    async createTransaction(transactionData) {
        return this.makeRequest('/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
    }

    async updateTransaction(id, transactionData) {
        return this.makeRequest(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transactionData)
        });
    }

    async deleteTransaction(id) {
        return this.makeRequest(`/transactions/${id}`, {
            method: 'DELETE'
        });
    }

    // Appointment methods
    async getAppointments() {
        return this.makeRequest('/appointments');
    }

    async getAppointment(id) {
        return this.makeRequest(`/appointments/${id}`);
    }

    async createAppointment(appointmentData) {
        return this.makeRequest('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
    }

    async updateAppointment(id, appointmentData) {
        return this.makeRequest(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(appointmentData)
        });
    }

    async deleteAppointment(id) {
        return this.makeRequest(`/appointments/${id}`, {
            method: 'DELETE'
        });
    }

    // Comment methods
    async getComments() {
        return this.makeRequest('/comments');
    }

    async getComment(id) {
        return this.makeRequest(`/comments/${id}`);
    }

    async createComment(commentData) {
        return this.makeRequest('/comments', {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
    }

    async updateComment(id, commentData) {
        return this.makeRequest(`/comments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(commentData)
        });
    }

    async deleteComment(id) {
        return this.makeRequest(`/comments/${id}`, {
            method: 'DELETE'
        });
    }
}

// Usage example
async function exampleUsage() {
    const api = new BookstoreAPIClient();

    try {
        // Register a new user
        console.log('Registering user...');
        await api.register({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            role: 'user'
        });

        // Login
        console.log('Logging in...');
        const loginResponse = await api.login('john@example.com', 'password123');
        console.log('Login successful:', loginResponse);

        // Get all books (public endpoint)
        console.log('Getting books...');
        const booksResponse = await api.getBooks();
        console.log('Books:', booksResponse);

        // Get all users (protected endpoint)
        console.log('Getting users...');
        const usersResponse = await api.getUsers();
        console.log('Users:', usersResponse);

        // Create a new book
        console.log('Creating book...');
        const newBook = await api.createBook({
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            isbn: '978-0-7432-7356-5',
            genre: 'Classic Literature',
            publishedYear: 1925,
            totalCopies: 5,
            availableCopies: 5,
            description: 'A classic American novel',
            price: 15.99
        });
        console.log('New book created:', newBook);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// For Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookstoreAPIClient;
}

// For browser usage
if (typeof window !== 'undefined') {
    window.BookstoreAPIClient = BookstoreAPIClient;
}

// Run example if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    exampleUsage();
}
