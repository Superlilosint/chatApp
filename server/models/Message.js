const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, maxlength: 2000 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  },
  { timestamps: true }
);

messageSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
