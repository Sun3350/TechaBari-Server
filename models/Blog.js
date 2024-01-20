const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
  author: String, 
  image: String,// Change the type to String to store the username
  isPublished: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Blog', blogSchema);
