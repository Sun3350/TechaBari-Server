const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    message: String,
    title: String,
    blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields

);

// Create a model for notifications
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
