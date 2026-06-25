const User = require('../models/User');

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-__v');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
    });
  } catch (err) {
    next(err);
  }
};
