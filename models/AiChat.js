const mongoose = require('mongoose');

const AiChatSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    messages: [
      {
        role: { type: String, enum: ['user', 'ai'], required: true },
        content: { type: String, required: true },
      },
    ],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Aichat', AiChatSchema);  