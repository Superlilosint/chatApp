const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  providerId: { type: String, required: true },
  provider: { type: String, enum: ['google', 'github'], required: true },
  email: { type: String, default: '' },
  displayName: { type: String, required: true },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ providerId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
