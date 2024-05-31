// routes/profile.js
const express = require('express');
const router = express.Router();
// Import the upload middleware
const User = require('../models/User');




router.post('/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    // Get the user ID from the request (you may use a session or token for authentication)
    const userId = req.user.id; // Replace this with your authentication logic

    // Find the user in the database by ID
    const user = await User.findById(userId);

    // Update the user's profile picture field with the uploaded file path
    user.profilePicture = req.file.path;

    // Save the updated user document
    await user.save();

    res.status(200).json({ message: 'Profile picture uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Profile picture upload failed' });
  }
});



// POST request to update user profile
router.post('/update-profile', upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user.id; // Replace with your authentication logic
    const { username, password, newPassword } = req.body;

    // Fetch the user from the database by ID
    const user = await User.findById(userId);

    // Check if the provided password matches the current password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Update user details
    user.username = username;
    
    // If newPassword is provided, update the password
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    // If a new profile picture is uploaded, update the profilePicture field
    if (req.file) {
      user.profilePicture = req.file.path;
    }

    await user.save();

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router;
