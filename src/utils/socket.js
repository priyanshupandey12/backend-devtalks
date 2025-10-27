const socket=require('socket.io')
const crypto=require('crypto');
const Chat = require('../models/chat.model');
const logger = require('../utils/logger');
const Connection=require('../models/connection.model')
const { setUserOnline, setUserOffline, getSocketIdForUser } = require('../utils/redis.js');

const gethashSocket=(loggedin,userId)=>{
   return crypto.createHash("sha256").update([loggedin,userId].sort().join("_")).digest("hex")
}



const intiliazeSocket=(server)=>{
    logger.info("Socket.io service initializing...");
  const io=socket(server,{
    cors:{
      origin:process.env.FRONTEND_URL,
       credentials: true 
    }
  })




const broadcastStatusChange = async (user, isOnline, io) => {
        try {
           logger.debug(`Broadcasting status (${isOnline}) to room ${user._id}`);
    
    io.to(user._id.toString()).emit('user_status_update', {
      userId: user._id,
      isOnline: isOnline,
    });
        } catch (error) {
          logger.error("Error in broadcastStatusChange", {
        error: error.message,
        stack: error.stack,
        userId: user._id
      });
        }
    };

  
  io.on('connection',(socket)=>{
    logger.info(`New socket connection: ${socket.id}`);

   const connectedUserId = socket.handshake.query.userId;
        if (connectedUserId) {
             logger.info(`Socket ${socket.id} authenticated for user: ${connectedUserId}`);
            socket.userId = connectedUserId;
            setUserOnline(socket.userId, socket.id);
        }
    socket.on('joinchat',({loggedin,userId})=>{
  
      const roomId=gethashSocket(loggedin,userId)
     logger.debug(`User ${loggedin} (Socket: ${socket.id}) joining chat room: ${roomId}`);
 
      socket.join(roomId);

    })

   


     socket.on("announce online", async (userId) => {
            try {
              logger.info(`User ${userId} announced online with socket ${socket.id}`);
                await setUserOnline(userId, socket.id);
                socket.userId = userId; 

                const connections = await Connection.find({
                 $or: [{ fromuserId: userId }, { toconnectionId: userId }],
                status: 'accepted'
                  });

   
                        connections.forEach(conn => {
                           const friendId = conn.fromuserId.toString() === userId
                              ? conn.toconnectionId.toString()
                         : conn.fromuserId.toString();
        
     
                      socket.join(friendId); 
      logger.debug(`User ${userId} joined room for friend ${friendId}`);
    });

                const user = { _id: userId }; 
                await broadcastStatusChange(user, true, io);

              
            } catch (error) {
        logger.error("Error in 'announce online' event", {
          error: error.message,
          stack: error.stack,
          userId,
          socketId: socket.id
        });
            }
        });

        socket.on('check_user_status', async ({ userIdToCheck }) => {
    try {
      
        
 logger.debug(`User ${socket.userId} checking status for ${userIdToCheck}`);

        const socketId = await getSocketIdForUser(userIdToCheck);
        
 
        socket.emit('user_status_update', {
            userId: userIdToCheck,
            isOnline: !!socketId 
        });
    } catch (error) {
       logger.error("Error in 'check_user_status' event", {
          error: error.message,
          stack: error.stack,
          userId: socket.userId
        });
    }
});



socket.on("outgoing_call", async ({to, from, channelName}) => {
            try { 
              logger.debug(`Outgoing call from ${from} to ${to}`);
                const receiverSocketId = await getSocketIdForUser(to);

                if(receiverSocketId) {
                    logger.warn(`Call failed: User ${to} is not online. (Caller: ${from})`);
                    io.to(receiverSocketId).emit('incoming_call', {
                        from: from, 
                        channelName: channelName
                    });
                } else {
                    socket.emit("user_unavailable", { 
                        message: "The user you are calling is not currently online." 
                    });
                }
            } catch (error) {
        logger.error("Error in 'outgoing_call' event", {
          error: error.message,
          stack: error.stack,
          from,
          to
        });
            }
        })

    socket.on('sendmessage',async({firstName,loggedin,
      userId,
      text})=>{
   

        try {
          const roomId=gethashSocket(loggedin,userId)
          logger.debug(`Message from ${loggedin} to ${userId} in room ${roomId}`);
        
      
          let chat=await Chat.findOne({
             participants:{$all:[loggedin,userId]}
          });

          if(!chat) {
            logger.info(`Creating new chat room for ${loggedin} and ${userId}`);
           chat=await Chat.create({
              participants:[loggedin,userId],
              messages:[]

            })
          }
          chat.messages.push({
            senderId:loggedin,
            text,
          })

          await chat.save();
         
         const lastMsg = chat.messages[chat.messages.length - 1];
          io.to(roomId).emit("messageDelivered", {
         firstName,
          text,
         senderId: loggedin,  
         _id: lastMsg._id,
         createdAt: lastMsg.createdAt, 

});      
        } catch (error) {
        logger.error("Error in 'sendmessage' event", {
          error: error.message,
          stack: error.stack,
          senderId: loggedin,
          receiverId: userId
        });
        }
      })

socket.on("disconnect", async () => {

  const userId = socket.userId; 

  try {
    if (userId) {
      logger.info(`Socket disconnected: ${socket.id}. User: ${userId}. Starting 2s delay...`);

    
      await new Promise(resolve => setTimeout(resolve, 2000));
      
     
      const currentSocketId = await getSocketIdForUser(userId);
      
    
      if (currentSocketId === socket.id) {
     
        logger.info(`User ${userId} confirmed offline. Broadcasting.`);
        await setUserOffline(userId);
        const user = { _id: userId };
        await broadcastStatusChange(user, false, io);
      } else {
 
        logger.info(`User ${userId} reconnected with new socket ${currentSocketId}. No offline broadcast.`);
      }
    } else {
      logger.info(`Socket disconnected: ${socket.id}. User was not authenticated.`);
    }
  } catch (error) {
    logger.error("Error in 'disconnect' event", {
        error: error.message,
        stack: error.stack,
        userId: userId || 'unknown' 
    });
  }
});
  
  })
}

module.exports=intiliazeSocket