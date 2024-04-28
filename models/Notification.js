const mongoose = require('mongoose')
const notificationSchema = new mongoose.Schema({
    message: String,
    blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
    read: { type: Boolean, default: false }
  });
  
  // Create a model for notifications
  const notification = mongoose.model('Notification', notificationSchema);
  module.exports = notification