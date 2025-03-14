// Load environment variables at the beginning
require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors'); // Import cors
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS for cross-origin requests

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
});

// Simple API endpoint to get products
app.get('/api/products', async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || 'duclecik_LifeCouture';
    console.log('Executing database query...');
    console.log(`Using database: ${dbName}`);
    
    // Use fully qualified table name
    const [products] = await pool.query(`SELECT * FROM \`${dbName}\`.\`Product\``);
    
    console.log(`Retrieved ${products.length} products from database`);
    res.json(products); // Send JSON response
  } catch (error) {
    console.error('Database error details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products', 
      details: error.message 
    });
  }
});

// Serve static files (if needed for frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML at root (only if frontend files are present in the 'public' folder)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test database connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`Database connection successful to ${process.env.DB_NAME || 'duclecik_LifeCouture'} at ${process.env.DB_HOST || 'cpanel.cikeys.com'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Run connection test before starting server
testConnection().then(() => {
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
