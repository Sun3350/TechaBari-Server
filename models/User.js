// models/User.js
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }, // Default to non-admin
  profilePicture: String,
});
userSchema.plugin(passportLocalMongoose, { usernameField: 'username' }); // Use your actual field name

const User = mongoose.model('User', userSchema);

module.exports = User;