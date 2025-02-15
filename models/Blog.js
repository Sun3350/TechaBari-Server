const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  imageDesc: {
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
  image: { 
    type: String, 
    required: true 
  },
  views: { type: Number, default: 0 }, // Tracks the number of views
  likesCount: { type: Number, default: 0 }, // ✅ Store like count instead of emails
  likedUsers: { type: [String], default: [] } ,
  comments: [
    {
      user: { type: String }, // No `required: true` (optional)
      text: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  isFeatured: { type: Boolean, default: false }, // For admin-selected featured posts

  status: {  
    type: String,   
    enum: ['pending', 'approved', 'rejected'], // Define allowed states
    default: 'pending', // Default state is "pending"
  },
  publishedAt: {  type: Date,
    default: null, // Will be updated when the post is approved
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // Reference to User model
});

blogSchema.index({ title: 'text' });

module.exports = mongoose.model('Blog', blogSchema);
