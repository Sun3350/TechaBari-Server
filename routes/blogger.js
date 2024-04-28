// posts.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Blog = require('../models/Blog'); // Import the Blog model
const authenticateUser = require('../middleware/authenticateUser'); 
const posts = [];
const user =require('../models/User')
const path = require('path');
const multer = require('multer');
const Draft = require('../models/Draft')
const Notification = require('../models/Notification')

//create post
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post('/create', authenticateUser, upload.array('images', 5),
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
      });

      if (Array.isArray(req.files) && req.files.length > 0) {
        newPost.images = req.files.map(file => path.join(file.filename));
      }

      await newPost.save();

      sendNotificationToAdmin(newPost);

      res.status(201).json({ message: 'Post created successfully' });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

async function sendNotificationToAdmin(blog) {
  try {
    // Save the notification to the database
    const notification = await Notification.create({ 
      message: `New blog submitted by ${blog.author}: ${blog.title}`,
      blogId: blog._id
    });
    console.log('Notification saved:', notification);
  } catch (error) {
    console.error('Error saving notification:', error);
  }
}

// Update a blog
router.put('/update/posts/:postId', authenticateUser, upload.array('image'), async (req, res) => {
  try {
    const postId = req.params.postId;
    const { title, content, category } = req.body;

    const updatedPostData = { title, content, category };

    if (Array.isArray(req.files) && req.files.length > 0) {
      updatedPostData.images = req.files.map(file => `uploads/${file.filename}`);
    }

    const updatedPost = await Blog.findByIdAndUpdate(postId, updatedPostData, { new: true });
    
    res.status(200).json({ message: 'Blog post updated successfully', post: updatedPost });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


//Admin Update Blog
 router.put('/admin/update/posts/:postId', upload.array('image'), async (req, res) => {
  try {
    const postId = req.params.postId;
    const { title, content, category } = req.body;

    const updatedPostData = { title, content, category };

    if (Array.isArray(req.files) && req.files.length > 0) {
      updatedPostData.images = req.files.map(file => `${file.filename}`);
    }

    const updatedPost = await Blog.findByIdAndUpdate(postId, updatedPostData, { new: true });
    
    res.status(200).json({ message: 'Blog post updated successfully', post: updatedPost });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//Get All Unpublished Blog
router.get('/unpublished-blogs', async (req, res) => {
  try {
    // Find all blog posts with isPublished set to false
    const unpublishedBlogPosts = await Blog.find({ isPublished: false })
      .populate('author', 'username');
    res.status(200).json(unpublishedBlogPosts);
  } catch (error) {
    console.error('Error fetching unpublished blog posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/published-blogs', async (req, res) => {
  try {
    // Find all blog posts with isPublished set to false
    const unpublishedBlogPosts = await Blog.find({ isPublished: true })
      .populate('author', 'username');
    res.status(200).json(unpublishedBlogPosts);
  } catch (error) {
    console.error('Error fetching unpublished blog posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Get the User Unpublished Blog
router.get('/unpublished-blogs/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const unpublishedBlogPost = await Blog.findOne({ _id: postId, isPublished: false })
      .populate('author', 'username');

    if (!unpublishedBlogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.status(200).json(unpublishedBlogPost);
  } catch (error) {
    console.error('Error fetching unpublished blog post details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/published-blogs/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const unpublishedBlogPost = await Blog.findOne({ _id: postId, isPublished: true })
      .populate('author', 'username');

    if (!unpublishedBlogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.status(200).json(unpublishedBlogPost);
  } catch (error) {
    console.error('Error fetching unpublished blog post details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//update the defaul value of isPublish to true
router.put('/update-publish-blog/:postId', async (req, res) => {
 
  try {
    const postId = req.params.postId;
    const currentDate = new Date();
    const updatedBlog = await Blog.findByIdAndUpdate( {_id: postId}, { isPublished: true, publishedAt: currentDate }, { new: true });
    res.status(200).json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

   
//Get All Post By User 

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


//Get post to Edit
router.get('/posts/:postId', authenticateUser, async (req, res) => {
  const { postId } = req.params;
  const username = req.user.username; 

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

//Get Post FOr Review In Admin
router.get('/admin/posts/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Blog.findOne({ _id: postId });

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

//get post by categories

router.get('/categories-blogs', async (req, res) => {
  try {
    const { category } = req.query;
    let blogs;

    if (category) {
      // If category parameter is provided, filter blogs by category
      blogs = await Blog.find({ category });
    } else {
      // If no category parameter provided, return all blogs
      blogs = await Blog.find();
    }

    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'An error occurred while fetching blogs' });
  }
})


//Get Post For Single Page 
router.get('/postDetails/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;

    // Fetch the post from the database using the Post model
    const post = await Blog.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Return the post details
    res.json(post);
  } catch (error) {
    console.error('Error fetching post details:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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
router.delete('/admin-delete/posts/:postId', async (req, res) => {
  const { postId } = req.params;
 

  try {
    const post = await Blog.findOne({ _id: postId });

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

router.get('/unpublished-count', async (req, res) => {
  try {
   
    const unpublishedCount = await Blog.countDocuments({ isPublished: false });

    // Respond with the count as JSON
    res.json({ unpublishedCount });
  } catch (error) {
    console.error('Error fetching unpublished count:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/Draft-count', async (req, res) => {
  try {
   
    const draftCount = await Draft.countDocuments({ isDraft: true });

    // Respond with the count as JSON
    res.json({ draftCount });
  } catch (error) {
    console.error('Error fetching unpublished count:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
    await draft.deleteOne();
    res.status(200).json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;
