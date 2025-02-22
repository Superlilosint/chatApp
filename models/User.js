const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String, 
        required: true,
    },
    socketId: {
        type: String,
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
    }
})

module.exports = mongoose.model('User', userSchema);
