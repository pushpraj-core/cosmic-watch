const Chat = require('../models/Chat');
const User = require('../models/User');

exports.getMessages = async (req, res) => {
  try {
    const { neoId } = req.params;
    const messages = await Chat.find({ neoId })
      .populate('userId', 'username')
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveMessage = async (req, res) => {
  try {
    const { neoId, message } = req.body;
    const user = await User.findById(req.user.userId);
    
    const chat = new Chat({
      neoId,
      userId: req.user.userId,
      username: user.username,
      message
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
