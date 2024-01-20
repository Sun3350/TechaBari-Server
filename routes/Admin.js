// routes/admin.js
const express = require('express');
const Blog = require('../models/Blog');
const router = express.Router();

// Admin panel to view and approve pending blog posts
router.get('/admin', isAdmin, (req, res) => {
  Blog.find({ isPublished: false })
    .populate('author') // Populate the author field with user data
    .exec((err, pendingBlogs) => {
      if (err) {
        req.flash('error', 'Error fetching pending blog posts');
        res.redirect('/blogs');
      } else {
        res.render('admin', { pendingBlogs });
      }
    });
});

// Approve a pending blog post
router.post('/admin/approve/:id', isAdmin, (req, res) => {
  const blogId = req.params.id;

  Blog.findByIdAndUpdate(
    blogId,
    { $set: { published: true } }, // Update the published status to true
    (err) => {
      if (err) {
        req.flash('error', 'Error approving blog post');
      } else {
        req.flash('success', 'Blog post approved and published');
      }
      res.redirect('/admin');
    }
  );
});

function isAdmin(req, res, next) {
  // Check if the user is an admin (you can implement your own logic for this)
  if (req.user && req.user.isAdmin) {
    return next();
  }
  req.flash('error', 'You are not authorized to access the admin panel');
  res.redirect('/blogs');
}

module.exports = router;
