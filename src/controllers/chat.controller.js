const Chat=require('../models/chat.model');



const newchat = async (req, res) => {
  const { userId } = req.params;
  const loggedin = req.user._id;

  try {
    let chat = await Chat.findOne({
      participants: { $all: [loggedin, userId] }
    })

    .populate('participants', 'firstName lastName photoUrl isOnline');

    if (!chat) {
     
      const newChatData = {
        participants: [loggedin, userId],
        messages: []
      };
      chat = await (await Chat.create(newChatData)).populate('participants', 'firstName lastName photoUrl isOnline');
    }
    
    res.status(200).json({ message: "your messages", data: chat });
    
  } catch (error) {
    console.log(error);
    return res.status(400).json("error in chat creating");
  }
};

module.exports={newchat}