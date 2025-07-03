// Node.js Example - How to use the Bookstore API from another Node.js project
// Run this with: node nodejs-example.js

const https = require('https');
const http = require('http');

class BookstoreAPIClient {
    constructor(baseURL = 'http://localhost:3002/api') {
        this.baseURL = baseURL;
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    async makeRequest(endpoint, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseURL + endpoint);
            const isHttps = url.protocol === 'https:';
            
            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            if (this.token) {
                requestOptions.headers['Authorization'] = `Bearer ${this.token}`;
            }

            const client = isHttps ? https : http;
            const req = client.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(jsonData);
                        } else {
                            reject(new Error(jsonData.message || 'Request failed'));
                        }
                    } catch (error) {
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (options.body) {
                req.write(options.body);
            }

            req.end();
        });
    }

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

    async getBooks() {
        return this.makeRequest('/books');
    }

    async getUsers() {
        return this.makeRequest('/users');
    }

    async createBook(bookData) {
        return this.makeRequest('/books', {
            method: 'POST',
            body: JSON.stringify(bookData)
        });
    }

    async getTransactions() {
        return this.makeRequest('/transactions');
    }

    async createTransaction(transactionData) {
        return this.makeRequest('/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
    }
}

// Example usage
async function runExample() {
    console.log('🚀 Starting Bookstore API Example...\n');
    
    const api = new BookstoreAPIClient();
    
    try {
        // Step 1: Register a new user
        console.log('📝 Registering a new user...');
        const registerData = {
            name: 'Jane Smith',
            email: 'jane@example.com',
            password: 'password123',
            role: 'user'
        };
        
        const registerResponse = await api.register(registerData);
        console.log('✅ User registered successfully:', registerResponse.message);
        
        // Step 2: Login
        console.log('\n🔐 Logging in...');
        const loginResponse = await api.login('jane@example.com', 'password123');
        console.log('✅ Login successful! Token received.');
        
        // Step 3: Get all books (public endpoint)
        console.log('\n📚 Getting all books...');
        const booksResponse = await api.getBooks();
        console.log('✅ Books retrieved:', booksResponse.data.length, 'books found');
        
        // Step 4: Get all users (protected endpoint)
        console.log('\n👥 Getting all users (requires authentication)...');
        const usersResponse = await api.getUsers();
        console.log('✅ Users retrieved:', usersResponse.data.length, 'users found');
        
        // Step 5: Create a new book
        console.log('\n📖 Creating a new book...');
        const newBookData = {
            title: 'To Kill a Mockingbird',
            author: 'Harper Lee',
            isbn: '978-0-06-112008-4',
            genre: 'Fiction',
            publishedYear: 1960,
            totalCopies: 3,
            availableCopies: 3,
            description: 'A gripping, heart-wrenching, and wholly remarkable tale of coming-of-age in a South poisoned by virulent prejudice.',
            price: 12.99
        };
        
        const newBookResponse = await api.createBook(newBookData);
        console.log('✅ Book created successfully:', newBookResponse.data.title);
        
        // Step 6: Get transactions
        console.log('\n📋 Getting transactions...');
        const transactionsResponse = await api.getTransactions();
        console.log('✅ Transactions retrieved:', transactionsResponse.data.length, 'transactions found');
        
        console.log('\n🎉 Example completed successfully!');
        console.log('\n📄 Your JWT token is:', loginResponse.token);
        console.log('\n💡 You can now use this token to make authenticated requests to the API.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the example
if (require.main === module) {
    runExample();
}

module.exports = BookstoreAPIClient;
