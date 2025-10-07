const socket=require('socket.io')
const crypto=require('crypto');
const Chat = require('../models/chat.model');
const User = require('../models/user.model');
const Connection=require('../models/connection.model')
const { setUserOnline, setUserOffline, getSocketIdForUser } = require('../utils/redis.js');

const gethashSocket=(loggedin,userId)=>{
   return crypto.createHash("sha256").update([loggedin,userId].sort().join("_")).digest("hex")
}



const intiliazeSocket=(server)=>{
  const io=socket(server,{
    cors:{
      origin:'http://localhost:5173',
       credentials: true 
    }
  })




const broadcastStatusChange = async (user, isOnline, io) => {
        try {
            const connections = await Connection.find({
                $or: [{ fromuserId: user._id.toString() }, { toconnectionId: user._id.toString() }],
                status: 'accepted'
            });

            if (!connections || connections.length === 0) return;

        
            await Promise.all(connections.map(async (connection) => {
                let friend;
                if (connection.fromuserId.toString() === user._id.toString()) {
                    friend = connection.toconnectionId;
                } else {
                    friend = connection.fromuserId;
                }

             
                const friendSocketId = await getSocketIdForUser(friend.toString());

                if (friendSocketId) {
                    io.to(friendSocketId).emit('user_status_update', {
                        userId: user._id,
                        isOnline: isOnline,
                    });
                }
            }));
        } catch (error) {
            console.error("Error broadcasting status change:", error);
        }
    };

  
  io.on('connection',(socket)=>{

   const connectedUserId = socket.handshake.query.userId;
        if (connectedUserId) {
             
            socket.userId = connectedUserId;
            setUserOnline(socket.userId, socket.id);
        }
    socket.on('joinchat',({loggedin,userId})=>{
  
      const roomId=gethashSocket(loggedin,userId)

 
      socket.join(roomId);

    })

   


     socket.on("announce online", async (userId) => {
            try {
              
                await setUserOnline(userId, socket.id);
                socket.userId = userId; 

                const user = { _id: userId }; 
                await broadcastStatusChange(user, true, io);

              
            } catch (error) {
                console.error("Error in user_online event:", error);
            }
        });

        socket.on('check_user_status', async ({ userIdToCheck }) => {
    try {
      
        
 

        const socketId = await getSocketIdForUser(userIdToCheck);
        
 
        socket.emit('user_status_update', {
            userId: userIdToCheck,
            isOnline: !!socketId 
        });
    } catch (error) {
        console.error("Error in check_user_status event:", error);
    }
});

//  socket.on("outgoing_call",async({to,from,channelName})=>{
//    try { 
//      const reciever=await User.findById(to);

//      if(reciever && reciever.socketid && reciever.isOnline) {
      
//        io.to(reciever.socketid).emit('incoming_call', {
//         from: from, 
//         channelName: channelName
//       });
   
//      }  else {
//      socket.emit("user_unavailable", { 
//     message: "The user you are calling is not currently online." 
//   });
//      }
//    } catch (error) {
//       console.error("Error in outgoing_call event:", error);
//    }
//  })

socket.on("outgoing_call", async ({to, from, channelName}) => {
            try { 
              
                const receiverSocketId = await getSocketIdForUser(to);

                if(receiverSocketId) {
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
                console.error("Error in outgoing_call event:", error);
            }
        })

    socket.on('sendmessage',async({firstName,loggedin,
      userId,
      text})=>{
   

        try {
          const roomId=gethashSocket(loggedin,userId)
           console.log(text)
      
          let chat=await Chat.findOne({
             participants:{$all:[loggedin,userId]}
          });

          if(!chat) {
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
          console.log(error)  
        }
      })

 socket.on("disconnect", async () => {
  try {

      if (socket.userId) {
         
            await setUserOffline(socket.userId);
            
       
            const user = { _id: socket.userId };
            await broadcastStatusChange(user, false, io);
        }
  } catch (error) {
    console.error("Error in disconnect event:", error);
  }
});
  
  })
}

module.exports=intiliazeSocket