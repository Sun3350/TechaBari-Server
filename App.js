const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const bloggerRoutes = require('./routes/blogger');
const adminRoutes = require('./routes/Admin');
const authenticateUser = require('./middleware/authenticateUser'); 
const path = require('path');
const app = express();


app.use(cors());
mongoose.connect('mongodb+srv://Techabari:Techabari2023@cluster0.myxx4gd.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('MongoDB is connected');
});


app.use(
  cors({
    origin: 'http://localhost:3000', 
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
app.use('/profile', profileRoutes);
app.use('/api/blogger', bloggerRoutes);
app.use('/api/admin', adminRoutes)


const PORT = process.env.PORT || 5000;

app.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Server is running on port ${PORT}`);
});
