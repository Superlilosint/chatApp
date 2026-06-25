const Message = require('../models/Message');
const Room = require('../models/Room');

exports.getRoomMessages = async (req, res, next) => {
  try {
    const room = await Room.findOne({ name: req.params.roomName });
    if (!room) {
      return res.json([]);
    }

    const messages = await Message.find({ room: room._id })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate('user', 'displayName avatar');

    res.json(
      messages.map((msg) => ({
        id: msg._id,
        text: msg.text,
        user: msg.user?.displayName || 'Unknown',
        avatar: msg.user?.avatar || '',
        createdAt: msg.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
};

exports.listRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 }).limit(50);
    res.json(rooms.map((r) => ({ id: r._id, name: r.name })));
  } catch (err) {
    next(err);
  }
};
