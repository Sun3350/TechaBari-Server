const Blog = require('../models/Blog');

// Create a new blog post
module.exports.createBlog = async (req, res) => {
  try {
    const { title, content, categories } = req.body;
    const author = req.user._id; // Assuming you store the user's ID in the request after authentication

    const blog = new Blog({
      title,
      content,
      img,
      dec,
      author,
      categories,
      status: 'draft', // Initially set as a draft
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update an existing blog post
module.exports.updateBlog = async (req, res) => {
  try {
    const { title, content, categories, status } = req.body;
    const blogId = req.params.blogId;

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        title,
        dec,
        content,
        img,
        categories,
        status, // You can update the status here, e.g., from 'draft' to 'pending'
        updated_at: Date.now(),
      },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json(updatedBlog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get a list of published blogs
module.exports.getPublishedBlogs = async (req, res) => {
  try {
    const publishedBlogs = await Blog.find({ status: 'published' })
      .populate('author', 'username')
      .populate('categories', 'name');

    res.json(publishedBlogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get all blogs (admin-only route)
module.exports.getAllBlogs = async (req, res) => {
  try {
    const allBlogs = await Blog.find()
      .populate('author', 'username')
      .populate('categories', 'name');

    res.json(allBlogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports.updatePost = (req, res) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json("Not authenticated!");
  
    jwt.verify(token, "jwtkey", (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");
  
      const postId = req.params.id;
      const q =
        "UPDATE posts SET `title`=?,`desc`=?,`img`=?,`cat`=? WHERE `id` = ? AND `uid` = ?";
  
      const values = [req.body.title, req.body.desc, req.body.img, req.body.cat];
  
      db.query(q, [...values, postId, userInfo.id], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json("Post has been updated.");
      });
    });
  };

  module.exports.deletePost =  (req, res) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json("Not authenticated!");
  
    jwt.verify(token, "jwtkey", (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");
  
      const postId = req.params.id;
      const q = "DELETE FROM posts WHERE `id` = ? AND `uid` = ?";
  
      db.query(q, [postId, userInfo.id], (err, data) => {
        if (err) return res.status(403).json("You can delete only your post!");
  
        return res.json("Post has been deleted!");
      });
    });
  };

  // controllers/blogs.js
// ...

// Admin approves a pending blog
module.exports.approveBlog = async (req, res) => {
    try {
      const blogId = req.params.blogId;
  
      const updatedBlog = await Blog.findByIdAndUpdate(
        blogId,
        {
          status: 'published',
          updated_at: Date.now(),
        },
        { new: true }
      );
  
      if (!updatedBlog) {
        return res.status(404).json({ error: 'Blog not found' });
      }
  
      res.json(updatedBlog);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  