const jwt = require('jsonwebtoken');
require('dotenv').config()
const secretKey = process.env.SECRET_KEY;

function authenticateUser(req, res, next) {
  // Extract the JWT token from the "Authorization" header
  const authHeader = req.header('Authorization'); // Assuming the token is sent in the header
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
  
  const token = authHeader.split(' ')[1]; // Split and take the second part (the token)

  // Verify and decode the token
  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // Add user information to the request object
    next(); // Proceed to the next middleware or route
  } catch (error) {
    const errorMessage = 'Authentication failed. Error: ' + error.message;
    const stackTrace = 'Stack Trace: ' + error.stack;
    console.error(errorMessage);
    console.error(stackTrace);
    res.status(401).json({ message: 'Authentication failed' });
  }
}

module.exports = authenticateUser;
