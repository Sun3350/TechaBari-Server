const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Fetch all unread notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'An error occurred while fetching notifications' });
  }
});
router.get('/unread-notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ read: false});
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'An error occurred while fetching notifications' });
  }
});

// Fetch unread notifications count
router.get('/notifications/count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ error: 'An error occurred while fetching notification count' });
  }
});

// Mark a notification as read
router.put('/read-notifications/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const notification = await Notification.findOneAndUpdate(
      { blogId: postId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'An error occurred while marking notification as read' });
  }
});

// Delete a notification
router.delete('/deleteNotifications/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    await Notification.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'An error occurred while deleting notification' });
  }
});

module.exports = router;
