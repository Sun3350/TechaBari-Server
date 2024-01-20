const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  author: {
    type: String,  // Assuming author is a username or user ID
    required: true,
  },
  images: [{
    type: String,  // Assuming the image is stored as a file path or URL
  }],
  isDraft: {
    type: Boolean,
    default: true,  // Set default value to true for drafts
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Draft = mongoose.model('Draft', draftSchema);

module.exports = Draft;
