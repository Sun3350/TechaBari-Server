const express = require('express')
const router = express.Router();
const Notification = require('../models/Notification')


router.get('/notifications', async (req, res) => {
    try {

        const notifications = await Notification.find({ read: false });
        
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'An error occurred while fetching notifications' });
    }
});

  
  
router.put('/read-notifications/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const notification = await Notification.findOneAndUpdate({ blogId: postId }, { read: true }, { new: true });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'An error occurred while marking notification as read' });
  }
});

  router.delete('/deleteNotifications/:PostId', async (req, res) => {
    try {
      // Find the notification by ID and delete it
      const postId = req.params.postId
      await Notification.findByIdAndDelete({_id: postId});
  
      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'An error occurred while deleting notification' });
    }
  });
  module.exports = router;
