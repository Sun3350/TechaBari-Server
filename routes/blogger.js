// posts.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Blog = require('../models/Blog'); // Import the Blog model
const authenticateUser = require('../middleware/authenticateUser'); 
const cloudinary = require('../middleware/cloudConfiguration');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const Draft = require('../models/Draft')
const Notification = require('../models/Notification');
const { default: mongoose } = require('mongoose');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Blog Image',
    format: async (req, file) => 'jpg', // Always stores as JPG
    public_id: (req, file) => Date.now().toString(), // Unique filename
  },
});

const upload = multer({ storage: storage });

router.post('/create', authenticateUser, upload.single('image'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { title, content, category } = req.body;
    const username = req.user.username; // Correctly extract user ID
    const imageUrl = req.file.path;
    try {
      const newPost = new Blog({
        title,
        content,
        category,
        author: username, // Use the correct field from req.user
        image: imageUrl,
        userId: req.user.id, // Reference the user in the database
      });

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
      message: `New Post submitted by ${blog.author}`,
      title:`${blog.title}`,
      blogId: blog._id
    });
    console.log('Notification saved:', notification);
  } catch (error) {
    console.error('Error saving notification:', error);
  }
}

// Update a blog

router.put('/update/posts/:postId', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    const postId = req.params.postId;
    const { title, content, category } = req.body;

    const existingPost = await Blog.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const updatedPostData = { title, content, category };

    // ✅ Delete old image from Cloudinary before updating
    if (req.file) {
      if (existingPost.image) {
        const publicId = existingPost.image.split('/').pop().split('.')[0]; // Extract public_id
        await cloudinary.uploader.destroy(publicId);
      }
      updatedPostData.image = req.file.path; // Update new image
    }

    const updatedPost = await Blog.findByIdAndUpdate(postId, updatedPostData, { new: true });

    res.status(200).json({ message: 'Blog post updated successfully', post: updatedPost });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//Admin Update Blog

router.put('/admin/update/posts/:postId', upload.single('image'), async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, category } = req.body;

    // Find existing post
    const post = await Blog.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Update fields
    post.title = title;
    post.content = content;
    post.category = category;

    // ✅ Keep the old image if no new one is uploaded
    if (req.file) {
      // Delete old Cloudinary image if it exists
      if (post.image) {
        const publicId = post.image.split('/').pop().split('.')[0]; // Extract public_id from Cloudinary URL
        await cloudinary.uploader.destroy(publicId);
      }
      post.image = req.file.path; // ✅ Save new Cloudinary image URL
    }

    await post.save();
    res.status(200).json({ message: 'Post updated successfully', post });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//get all unpublisged blog
    
router.get('/unpublished-blogs', async (req, res) => {
  try {
    // Find all blog posts with isPublished set to false
    const unpublishedBlogPosts = await Blog.find({ status: "pending" })
      .populate('author', 'username');
    res.status(200).json(unpublishedBlogPosts);
  } catch (error) {
    console.error('Error fetching unpublished blog posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//get all post with isPublish true

router.get('/published-blogs', async (req, res) => {
  try {
    const unpublishedBlogPosts = await Blog.find({ status: 'approved' })
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
    const unpublishedBlogPost = await Blog.findOne({ _id: postId, status: "pending" })
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
router.put('/update-status/:postId', async (req, res) => {
  const { postId } = req.params;
  const { status } = req.body; // Status will be "pending", "approved", or "rejected"

  // Validate the status
  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid postId' });
  }

  try {
    const updateData = { status };
    if (status === 'approved') {
      updateData.publishedAt = new Date(); // Update publishedAt if approved
    } else {
      updateData.publishedAt = null; // Reset publishedAt for other statuses
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      postId,
      updateData,
      { new: true }
    );

    // Check if the blog post exists
    if (!updatedBlog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.status(200).json({ message: `Blog status updated to "${status}"`, blog: updatedBlog });
  } catch (error) {
    console.error(`Error updating blog post status with ID ${postId}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

   
//Get All Post By User 

router.get('/posts-by-user', authenticateUser, async (req, res) => {
  const userId = req.user.id;  // Get the user ID from the authenticated user

  try {
    const blogPosts = await Blog.find({ userId });  // Query Blog model with the 'userId' from the token
    res.status(200).json(blogPosts);
  } catch (error) {
    console.error('Error fetching user blog posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//
//const backfillImageDesc = async () => {
//  try {
//    const blogPosts = await Blog.find(); // Fetch all blog posts
//
//    for (const post of blogPosts) {
//      // Assign the new imageDesc field
//      post.imageDesc = "Work of art from the Nigeria Museum, 1953. Acquired from the slave trade.";
//
//      try {
//        await post.save({ validateModifiedOnly: true }); // Save only modified fields
//        console.log(`Successfully updated post ${post._id} with imageDesc.`);
//      } catch (saveError) {
//        console.error(`Failed to update post ${post._id}:`, saveError);
//      }
//    }
//  } catch (error) {
//    console.error("Error during backfill:", error);
//  }
//};
//
//// Call the function
//backfillImageDesc();


//Get post to Edit

   
router.get('/posts/:postId', authenticateUser, async (req, res) => {
  const { postId } = req.params;
  const username = req.user.username;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid postId format' });
  }

  console.log('Fetching post:', { postId, username });

  try {
    // Log database query before executing it for debugging
    console.log('Database query:', { _id: postId, author: username });

    const post = await Blog.findOne({
      _id: postId,
      author: username, // Use direct comparison
    });

    if (!post) {
      // Log more details if post is not found
      console.log('No post found for:', { postId, username });
      return res.status(404).json({ message: 'Post not found or unauthorized user' });
    }
   
    res.status(200).json({
      _id: post._id,
      title: post.title,
      content: post.content,
      category: post.category,
      image: post.image,
    });
  } catch (error) {
    console.error('Error fetching post details:', error.message);
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
      image: post.image,  // You may adjust this based on your data model
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
      image: draft.image,  // You may adjust this based on your data model
    });
  } catch (error) {
    console.error('Error fetching draft details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/search-admin', async (req, res) => {
  const { query } = req.query;

  try {
    // Perform regex search on 'title' field
    const searchResults = await Blog.find({ title: { $regex: new RegExp(query, 'i') } });
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching blogs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search', authenticateUser, async (req, res) => {
  const { query } = req.query;
  const username = req.user.username; // Assuming the user's ID is available in the request object

  try {
    // Perform regex search on 'title' field for the blogs of the logged-in user
    const searchResults = await Blog.find({ title: { $regex: new RegExp(query, 'i') }, author: username });
    console.log('working')
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching blogs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/search-main:postId', authenticateUser, async (req, res) => {
  const { query } = req.query;
  // Assuming the user's ID is available in the request object

  try {
    // Perform regex search on 'title' field for the blogs of the logged-in user
    const searchResults = await Blog.find({ title: { $regex: new RegExp(query, 'i') }, isPublished: true });
    console.log('working')
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching blogs:', error);
    res.status(500).json({ error: 'Internal server error' });
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
  upload.single('images'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { title, content, category } = req.body; 
    const username = req.user.username;
    const imageUrl = req.file.path

    try {
      const newDraft = new Draft({
        title,
        content,
        category,
        author: username,
        image: imageUrl,
        isDraft: true,
        createdAt: new Date(),
      });

     

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
