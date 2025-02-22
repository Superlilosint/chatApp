const mongoose = require("mongoose");

const messageShema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }

});

module.exports = mongoose.model("Message", messageShema);