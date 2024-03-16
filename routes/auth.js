const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const authenticateUser = require('../middleware/authenticateUser'); 

require('dotenv').config()
const secretKey = process.env.SECRET_KEY;



// JWT Middleware


// Routes
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Check if the username already exists
  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return res.status(400).json({ message: 'Username already in use' });
  }

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create a new user
  const newUser = new User({
    username,
    password: hashedPassword,
  });

  await newUser.save();
  res.json({ message: 'User registered successfully' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      
      const payload = {
        userId: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
      };
      const token = jwt.sign(payload, secretKey);
      res.json({ token , user: { username: user.username, isAdmin: user.isAdmin } });
      console.log(token )
      
    } else {
      res.status(401).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Admin login route
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Check if the user is an admin
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json({ message: 'Admin login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});





// Set up multer storage for profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/profiles'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + extension);
  },
});

const upload = multer({ storage: storage });


// Update user profile route
router.put('/profile', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userId = req.user.id; // Assuming you have implemented user authentication middleware

   
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user details
    if (username) {
      user.username = username;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

  
    // Save the updated user document
    await user.save();

    res.status(200).json({ message: 'User profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});


// Middleware to verify JWT tokens
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token expired or invalid' });
    }
    req.user = decoded;
    next();
  });
};

// Renew token route
router.get('/renew-token', verifyToken, (req, res) => {
  // Generate a new token with an extended expiration time
  const user = req.user; // User data from the current token
  const newToken = jwt.sign(user, secretKey, { expiresIn: '5h' });

  // Respond with the updated token
  res.status(200).json({ token: newToken });
});


router.get('/user-Info', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ username: user.username, isAdmin: user.isAdmin });
  } catch (error) {
    console.error('Error fetching user information:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
