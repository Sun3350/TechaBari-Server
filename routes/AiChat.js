
const express = require('express');
const router = express.Router();
const Aichat = require('../models/AiChat');
const authenticate = require('../middleware/authenticateUser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI('AIzaSyDg0ciNk44niQZJ6qBjaf_E0L8YKmii0IQ');

// Fetch all chats
router.get('/all-chats', authenticate, async (req, res) => {
  try {
    const chats = await Aichat.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Fetch specific chat by ID
router.get('/chats/:id', authenticate, async (req, res) => {
  try {
    const chat = await Aichat.findOne({ _id: req.params.id, userId: req.user.id });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Create a new chat
router.post('/new-chats', authenticate, async (req, res) => {
  try {
    const newChat = new Aichat({
      title: 'New Chat', // Default title
      messages: [],
      userId: req.user.id,
    });
    await newChat.save();
    res.status(201).json(newChat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create chat', details: err.message });
  }
});

router.patch('/update-title/:chatId', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    const chat = await Aichat.findByIdAndUpdate(
      chatId,
      { title },
      { new: true } // Return the updated document
    );

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update chat title', details: err.message });
  }
});


// Save a message in a chat
router.post('/save-chats/:id/messages', authenticate, async (req, res) => {
  const { role, content } = req.body;
  try {
    const chat = await Aichat.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $push: { messages: { role, content } } },
      { new: true }
    );
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Delete a chat
router.delete('/delete-chats/:id', authenticate, async (req, res) => {
  try {
    const chat = await Aichat.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.status(200).send('Chat deleted');
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Generate AI Response
router.post('/ai-response', authenticate, async (req, res) => {
  const { messages } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(messages.map(msg => msg.content).join("\n"));
    const aiMessage = result.response.text();
    res.status(200).json({ message: aiMessage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI response' });
  }
});

module.exports = router;
