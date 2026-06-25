const router = require('express').Router();
const { param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getRoomMessages, listRooms } = require('../controllers/roomController');

router.get('/', auth, listRooms);

router.get(
  '/:roomName/messages',
  auth,
  [param('roomName').trim().notEmpty().isLength({ max: 50 })],
  validate,
  getRoomMessages
);

module.exports = router;
