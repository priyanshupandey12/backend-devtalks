const Chat=require('../models/chat.model');
const logger=require('../utils/logger')


const newchat = async (req, res) => {
  
  const { userId } = req.params;
  const loggedin = req.user._id;
if (userId === loggedin.toString()) {
    logger.warn(`User ${loggedin} attempted to create a chat with themselves.`);
    return res.status(400).json({
      success: false,
      message: "You cannot start a chat with yourself."
    });
  }

  logger.debug(`Chat request between user ${loggedin} and ${userId}`);
  try {
    let chat = await Chat.findOne({
      participants: { $all: [loggedin, userId] }
    })

    .populate('participants', 'firstName lastName photoUrl isOnline');

    if (!chat) {
     logger.info(`Creating new chat between ${loggedin} and ${userId}`);
      const newChatData = {
        participants: [loggedin, userId],
        messages: []
      };
      chat = await (await Chat.create(newChatData)).populate('participants', 'firstName lastName photoUrl isOnline');
    }  else {
      logger.debug(`Found existing chat ${chat._id} for users ${loggedin} and ${userId}`);
    }
    
    res.status(200).json({ message: "your messages", data: chat });
    
  } catch (error) {
    
    logger.error(`Error in newchat controller for users ${loggedin} and ${userId}: ${error.message}`, {
      stack: error.stack,
      participants: [loggedin, userId]
    });

    return res.status(500).json({
      success: false,
      message: "An internal server error occurred."
    });
  }
};

module.exports={newchat}