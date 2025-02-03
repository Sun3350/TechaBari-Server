const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;

function authenticateUser(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication failed: No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token
  try {
    const decoded = jwt.verify(token, secretKey); // Verify and decode the token
    req.user = {
      id: decoded.id, // Attach the user ID
      username: decoded.username, // Attach the username
    };
    console.log('Authenticated User:', req.user); // Log user details for debugging
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Authentication failed:', error.message); // Log the error
    res.status(401).json({ message: 'Authentication failed: Invalid token' }); // Return error response
  }
}

module.exports = authenticateUser;
