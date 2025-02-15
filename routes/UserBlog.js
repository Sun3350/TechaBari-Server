const express = require('express');
const mongoose = require('mongoose'); // Ensure mongoose is available for ObjectId validation
const cors = require('cors'); // Optional: Enable CORS if required
const Blog = require('../models/Blog'); // Adjust the path as needed
const router = express.Router();
const Subscriber = require('../models/Subscribers');
const crypto = require('crypto');
const transporter = require('../middleware/transporter')
router.use(cors()); // Enable CORS if required

// Cached categories variables
let cachedCategories = [];
let lastUpdated = null;

// Helper to fetch random categories
const fetchRandomCategories = async () => {
  const categories = await Blog.aggregate([
    { $group: { _id: "$category" } }, // Group blogs by category
    { $sample: { size: 2 } }, // Randomly select 2 categories
  ]);
  return categories.map((c) => c._id); // Extract category names
};

// Function to update cached categories
const updateCachedCategories = async () => {
  cachedCategories = await fetchRandomCategories();
  lastUpdated = Date.now();
  console.log("Cached categories updated:", cachedCategories);
};

// Schedule category updates every 2 hours
setInterval(updateCachedCategories, 2 * 60 * 60 * 1000);

// Update categories at server start
updateCachedCategories();

// Middleware to validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format.' });
  }
  next();
};

// Endpoint to fetch blogs from cached categories
router.get('/latest-blogs', async (req, res) => {
  try {
    const twoHoursInMillis = 2 * 60 * 60 * 1000;
    if (!cachedCategories.length || Date.now() - lastUpdated > twoHoursInMillis) {
      await updateCachedCategories();
    }

    const limit = parseInt(req.query.limit, 10) || 2;

    // Fetch only blogs that are approved and match cached categories
    const blogs = await Blog.find({ 
        category: { $in: cachedCategories }, 
        status: "approved"  // ✅ Only fetch approved blogs
      })
      .sort({ publishedAt: -1 })  // ✅ Sort by `publishedAt` (newest first)
      .limit(limit);

    res.status(200).json({ categories: cachedCategories, blogs });
  } catch (error) {
    console.error("Error fetching latest blogs:", error);
    res.status(500).json({ message: "Unable to fetch the latest blogs. Please try again later." });
  }
});


// Endpoint to feature/unfeature a post 
router.put('/posts/:id/feature', validateObjectId, async (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;

  try {
    const post = await Blog.findByIdAndUpdate(id, { isFeatured }, { new: true });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update post', error });
  }
});

// Helper to get featured posts
const getFeaturedPosts = async () => {
  try {
    const posts = await Blog.find({ status: 'approved' }); // Fetch only approved blogs
    const postsWithPopularity = posts.map(post => ({
      ...post._doc,
      popularity: post.views * 0.5 + post.likes * 1 + post.comments.length * 2,
    }));

    const manualFeatured = postsWithPopularity.filter(post => post.isFeatured);
    const autoFeatured = postsWithPopularity
      .filter(post => !post.isFeatured)
      .sort((a, b) => b.popularity - a.popularity);

    const featuredPosts = [
      ...manualFeatured,
      ...autoFeatured.slice(0, Math.max(0, 5 - manualFeatured.length)),
    ];
    return featuredPosts;
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    throw new Error('Failed to fetch featured posts');
  }
};


// Endpoint to fetch featured posts
router.get('/featured-posts', async (req, res) => {
  try {
    const featuredPosts = await getFeaturedPosts();
    res.status(200).json(featuredPosts);
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    res.status(500).json({ message: 'Error fetching featured posts' });
  }
});

// Endpoint to like or unlike a post
router.post("/posts/:id/like", async (req, res) => {
  const { email } = req.body;
  const { id: postId } = req.params;

  try {
    const post = await Blog.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Ensure post has a likesCount field
    if (!post.likesCount) post.likesCount = 0;
    
    // Track user emails separately
    if (!post.likedUsers) post.likedUsers = [];

    const hasLiked = post.likedUsers.includes(email);

    if (hasLiked) {
      // Unlike the post
      post.likedUsers = post.likedUsers.filter(userEmail => userEmail !== email);
      post.likesCount -= 1;
    } else {
      // Like the post
      post.likedUsers.push(email);
      post.likesCount += 1;
    }
   
    await post.save();
    res.json({ 
      message: hasLiked ? "Post unliked" : "Post liked",
      likesCount: post.likesCount, // ✅ Return number of likes
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});




//enpoint to view a post 
router.post('/posts/:id/view', async (req, res) => {
  const { id } = req.params;
  try {
    // Increment the views field by 1
    const post = await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    res.json(post); // Return the updated post
  } catch (error) {
    res.status(500).json({ error: 'Error tracking view' });
  }
});


// Endpoint to comment on a post
router.post('/posts/:id/comment', async (req, res) => {
  const { id } = req.params; // Post ID
  const { text, user } = req.body; // Comment text and user name

  // Check if both text and user are provided
  if (!text || !user) {
    return res.status(400).json({ error: 'Text and user are required.' });
  }

  try {
    // Push the new comment into the comments array
    const post = await Blog.findByIdAndUpdate(
      id,
      { $push: { comments: { text, user } } }, // Update with text and user
      { new: true } // Return updated document
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    res.json(post); // Respond with the updated post
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Error adding comment' });
  }
});
//fetch comment 
router.get("/posts/:id/comments", async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id).populate("comments");
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }


    res.json({
      comments: post.comments,
      totalComments: post.comments.length, 
    });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Server error" });
  }
});


 //endpoint toget Post details 

router.get('/posts/:id', async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});

 // subscriber End Point


 router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  try {
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ error: 'Email is already subscribed.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    console.log('Raw token:', rawToken);
    console.log('Hashed token (to save):', hashedToken);

    const subscriber = new Subscriber({ email, verificationToken: hashedToken });
    await subscriber.save();

    const verificationLink = `http://localhost:3000/verify?token=${rawToken}&email=${encodeURIComponent(email)}`;
    console.log('Verification link:', verificationLink);

    await transporter.sendMail({
      from: '"Techabari" <isaacayomide2359@gmail.com>',
      to: email,
      subject: 'Verify Your Email',
      html: `
        <p>Thank you for subscribing! Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">Verify Subscription</a>
      `,
    });

    res.status(200).json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (error) {
    console.error('Error during subscription:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

//verififcation of subscriber

router.get('/verify', async (req, res) => {
  console.log('Query parameters:', req.query);

  const { token, email } = req.query;

  try {
    const decodedEmail = decodeURIComponent(email);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('Raw token from query:', token);
    console.log('Hashed token (to query):', hashedToken);

    const subscriber = await Subscriber.findOne({
      email: decodedEmail,
      verificationToken: hashedToken,
    });

    if (!subscriber) {
      return res.status(400).json({ error: 'Invalid token or email.', isVerified: false });
    }
    

  subscriber.isVerified = true;
  subscriber.verificationToken = null;
  await subscriber.save();

  console.log('Subscriber successfully verified:', subscriber);
  res.status(200).json({ message: 'Subscription verified successfully!', isVerified: true });
} catch (error) {
  console.error('Error while saving subscriber:', error);
  res.status(500).json({ error: 'Server error. Please try again later.' });
}
});

//et blog base on category 

router.get("/category", async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) return res.status(400).json({ message: "Category is required" });

    // Find only blogs that match the category and have status "approved"
    const blogs = await Blog.find({ 
      category: new RegExp(`^${category}$`, "i"), // Case-insensitive search
      status: "approved"   
    });
   
    res.json(blogs); 
  } catch (error) {
    console.error("Error fetching category blogs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/search', async (req, res) => {
  try {
    
    const { q, category, sort } = req.query;

    // Build the filter object for Mongoose
    const filter = {};

    if (q) {
      // Search in title and content using a case-insensitive regex
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }

    if (category) {
      // Assume blog category is stored in the "cat" field.
      filter.category = category;
    }

    // Determine sorting options
    let sortOption = {};
    if (sort) {
      if (sort === 'mostRecent') {
        sortOption.createdAt = -1; // descending order (newest first)
      } else if (sort === 'oldest') {
        sortOption.createdAt = 1; // ascending order
      } else if (sort === 'mostViewed') {
        sortOption.views = -1; // descending order by views
      } else if (sort === 'leastViewed') {
        sortOption.views = 1; // ascending order by views
      }
    } else {
      // Default sorting: most recent
      sortOption.createdAt = -1;
    }

    // Query the database with the filter and sorting options
    const blogs = await Blog.find(filter).sort(sortOption);
    
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Server error fetching blogs.' });
  }
});



module.exports = router;
