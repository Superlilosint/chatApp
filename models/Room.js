const mongoose = require('mongoose');
const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  users: [{
    type: mongoose.Schema.ObjectId,
    ref: "User"
  }],
  messages: [
    {
        type: mongoose.Schema.ObjectId,
        ref: "Message"
    }
  ]

});

module.exports = mongoose.model('Room', roomSchema);
