const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, maxlength: 50 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Room', roomSchema);
