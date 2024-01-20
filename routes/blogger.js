// posts.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Blog = require('../models/Blog'); // Import the Blog model
const authenticateUser = require('../middleware/authenticateUser'); 
const posts = [];
const user =require('../models/User')
const { formatDistanceToNow } = require('date-fns');
const humanizeDuration = require('humanize-duration');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Draft = require('../models/Draft')



router.post(
  '/create',
  authenticateUser,
  upload.array('images', 5),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { title, content, category } = req.body;
    const username = req.user.username;

    try {
      const newPost = new Blog({
        title,
        content,
        category,
        author: username,
        createdAt: new Date(),
      });

      if (req.files && req.files.length > 0) {
        newPost.images = req.files.map(file => file.path);
      }

      await newPost.save();

      // Calculate the time ago
      const timeAgo = formatDistanceToNow(newPost.createdAt, { addSuffix: true });
      res.status(201).json({ message: 'Post created successfully', timeAgo });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);
// Update a blog post with authentication
router.put('/update/:postId', authenticateUser, (req, res) => {
  const postId = parseInt(req.params.postId);
  const { title, content } = req.body;
  // You should add validation here
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.title = title;
    post.content = content;
    
    res.json({ message: 'Post updated successfully' });
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
});

// Delete a blog post with authentication

// Get all unpublished blog posts
router.get('/unpublished-blogs', async (req, res) => {
  try {
    // Find all blog posts with isPublished set to false
    const unpublishedBlogPosts = await Blog.find({ isPublished: false })
      .populate('author', 'username');

    // Respond with the list of unpublished blog posts
    res.status(200).json(unpublishedBlogPosts);
  } catch (error) {
    console.error('Error fetching unpublished blog posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/unpublished-blogs/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;

    // Find the blog post with the given ID and isPublished set to false
    const unpublishedBlogPost = await Blog.findOne({ _id: postId, isPublished: false })
      .populate('author', 'username');

    if (!unpublishedBlogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Respond with the full details of the unpublished blog post
    res.status(200).json(unpublishedBlogPost);
  } catch (error) {
    console.error('Error fetching unpublished blog post details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/publish/:postId', authenticateUser, async (req, res) => {
  const postId = req.params.postId;
  try {
    // Update the 'isPublished' field to true
    await Blog.findByIdAndUpdate(postId, { isPublished: true });
    res.status(200).json({ message: 'Blog post published successfully' });
  } catch (error) {
    console.error('Error publishing the blog post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/posts-by-user/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const blogPosts = await Blog.find({ author: username });
    res.status(200).json(blogPosts);
  } catch (error) {
    console.error('Error fetching user blog posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.get('/posts/:postId', authenticateUser, async (req, res) => {
  const { postId } = req.params;
  const username = req.user.username; // Assuming req.user contains the authenticated user details

  try {
    const post = await Blog.findOne({ _id: postId, author: username });

    if (!post) {
      return res.status(404).json({ message: 'Post not found or you do not have permission to access it' });
    }

    res.status(200).json({
      _id: post._id,
      title: post.title,
      content: post.content,
      category: post.category,
      images: post.images,  // You may adjust this based on your data model
    });
  } catch (error) {
    console.error('Error fetching post details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/drafts/:draftId', authenticateUser, async (req, res) => {
  const { draftId } = req.params;
  const username = req.user.username;

  try {
    const draft = await Draft.findOne({ _id: draftId, author: username, isDraft: true });

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    res.status(200).json({
      _id: draft._id,
      title: draft.title,
      content: draft.content,
      category: draft.category,
      images: draft.images,  // You may adjust this based on your data model
    });
  } catch (error) {
    console.error('Error fetching draft details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/drafts', authenticateUser, async (req, res) => {
  const username = req.user.username;

  try {
    const drafts = await Draft.find({ author: username, isDraft: true });
    res.status(200).json(drafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.post(
  '/create-draft',
  authenticateUser,
  upload.array('images', 5),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { title, content, category } = req.body;
    const username = req.user.username;

    try {
      const newDraft = new Draft({
        title,
        content,
        category,
        author: username,
        isDraft: true,
        createdAt: new Date(),
      });

      if (req.files && req.files.length > 0) {
        newDraft.images = req.files.map((file) => file.path);
      }

      await newDraft.save();

      res.status(201).json({ message: 'Draft saved successfully' });
    } catch (error) {
      console.error('Error saving draft:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);


// Inside your backend route handlers
router.delete('/delete-drafts/:draftId', authenticateUser, async (req, res) => {
  const { draftId } = req.params;
  const username = req.user.username;

  try {
    // Validate that the user owns the draft before deleting
    const draft = await Draft.findOne({ _id: draftId, author: username, isDraft: true });

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    // Delete the draft
    await draft.delete();

    res.status(200).json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/delete/posts/:postId', authenticateUser, async (req, res) => {
  const { postId } = req.params;
  const username = req.user.username;

  try {
    const post = await Blog.findOne({ _id: postId, author: username });

    if (!post) {
      return res.status(404).json({ message: 'Post not found or you do not have permission to delete' });
    }

    await post.deleteOne();

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint for admin to delete any post
router.delete('/admin/posts/:postId', authenticateUser, async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Blog.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.deleteOne();

    res.status(200).json({ message: 'Post deleted successfully by admin' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
