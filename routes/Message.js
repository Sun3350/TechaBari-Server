const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Message = require('../models/Message'); // Import the Message model
const  cloudinary  = require('../middleware/cloudConfiguration');
const router = express.Router();

const mongoose = require('mongoose');


// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Blog Image',
    public_id: (req, file) => Date.now().toString(),
  },
});

// Set up multer for file uploads
const upload = multer({ storage });

// File upload route
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Get the file data
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Save the message in MongoDB with file URL and fileType
    const newMessage = new Message({
      senderId: req.body.senderId, // Assuming senderId comes from the request
      messageType: 'file',
      content: file.path, // Cloudinary provides the URL as `path`
      fileType: file.mimetype,
    });

    // Save the message to the database
    await newMessage.save();
    res.status(200).json({ message: 'File uploaded successfully', fileUrl: file.path });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Add new message

// Add new message
// Add new message
router.post('/messages', async (req, res) => {
  const { senderId, messageType, content } = req.body;

  try {
    // Check if senderId is valid ObjectId string
    if (mongoose.Types.ObjectId.isValid(senderId)) {
      const message = await Message.create({
        senderId,  // If it's a string, no need to convert
        messageType,
        content,
      });
      res.status(201).json(message);
    } else {
      res.status(400).json({ error: 'Invalid senderId format' });
    }
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Error saving message' });
  }
});

// Get all messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Export the router
module.exports = router;
