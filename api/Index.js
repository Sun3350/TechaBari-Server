// api/index.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('../routes/auth');
//const profileRoutes = require('../routes/profile');
const bloggerRoutes = require('../routes/blogger');
const userPostRoutes = require('../routes/UserBlog')
const adminRoutes = require('../routes/Admin');
const aichatRoutes = require('../routes/AiChat');
const notificationRoutes = require('../routes/notification');
const authenticateUser = require('../middleware/authenticateUser');
const path = require('path');
const app = express();
const messagingRoutes = require('../routes/Message')

app.use(cors());
mongoose.connect('mongodb+srv://Techabari:Techabari2023@cluster0.myxx4gd.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set('debug', true);

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('MongoDB is connected');
});


app.use(
  cors({
    origin: ['http://localhost:3000', 'http://192.168.0.100:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/protected-route', authenticateUser, (req, res) => {
  const username = req.user.username;
  res.json({ message: `Authenticated user: ${username}` });
});

// Routes link
app.use('/api/auth', userRoutes);
//app.use('/profile', profileRoutes);
app.use('/api/blogger', bloggerRoutes);
app.use('/api/userPost', userPostRoutes )
app.use('/api/admin', adminRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/chat', aichatRoutes);
app.use('/api/messaging', messagingRoutes);

module.exports = app; // Export the 

const PORT = process.env.PORT || 5000;

app.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Server is running on port ${PORT}`);
});
