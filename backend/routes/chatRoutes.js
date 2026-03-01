const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/:neoId', chatController.getMessages);
router.post('/', authMiddleware, chatController.saveMessage);

module.exports = router;
