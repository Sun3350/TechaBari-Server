const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
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
    type: String,  
    required: true,
  },
  images: [{
    type: String, 
    required: true,
  }], 
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: {
    type: Date,
    default: null, // Set to null initially, and it will be updated when the post is published
  },
});
blogSchema.index({ title: 'text' });
module.exports = mongoose.model('Blog', blogSchema);
