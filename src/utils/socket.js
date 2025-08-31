const socket=require('socket.io')
const crypto=require('crypto');
const Chat = require('../models/chat.model');
const User = require('../models/user.model');
const Connection=require('../models/connection.model')


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
    }).populate('fromuserId').populate('toconnectionId');

    if (!connections || connections.length === 0) return;

    connections.forEach(connection => {
    
      if (!connection.fromuserId || !connection.toconnectionId) {
        return; 
      }
    

      let friend;
   
      if (connection.fromuserId._id.toString() === user._id.toString()) {
        friend = connection.toconnectionId;
      } else {
        friend = connection.fromuserId;
      }

      if (friend && friend.isOnline && friend.socketid) {
        io.to(friend.socketid).emit('user_status_update', {
          userId: user._id,
          isOnline: isOnline,
        });
      }
    });

  } catch (error) {
    console.error("Error broadcasting status change:", error);
  }
};

  
  io.on('connection',(socket)=>{


    socket.on('joinchat',({loggedin,userId})=>{

      const roomId=gethashSocket(loggedin,userId)

   
      socket.join(roomId);

    })

   

socket.on("user_online", async (userId) => {
  try {

    const user = await User.findById(userId);
    if (user) {
      user.socketid = socket.id;
      user.isOnline = true;
   
      await user.save();
       const connections = await Connection.find({
        $or: [{ fromuserId: user._id }, { toconnectionId: user._id }],
        status: 'accepted'
      }).populate('fromuserId').populate('toconnectionId');

    
      const onlineStatusMap = {};
      if (connections && connections.length > 0) {
        connections.forEach(conn => {
          if (!conn.fromuserId || !conn.toconnectionId) return;
          const friend = conn.fromuserId._id.toString() === user._id.toString() 
            ? conn.toconnectionId 
            : conn.fromuserId;
          onlineStatusMap[friend._id] = friend.isOnline;
        });
      }


      socket.emit('connections_status', onlineStatusMap);
      await broadcastStatusChange(user, true, io);
    } 

  } catch (error) {
    console.error("Error in user_online event:", error);
  }
});


 socket.on("outgoing_call",async({to,from,channelName})=>{
   try { 
     const reciever=await User.findById(to);

     if(reciever && reciever.socketid && reciever.isOnline) {
      
       io.to(reciever.socketid).emit('incoming_call', {
        from: from, 
        channelName: channelName
      });
   
     }  else {
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
    const user = await User.findOne({ socketid: socket.id });

    if (user) {
      user.isOnline = false;
      user.socketid = null; 
      await user.save();
      await broadcastStatusChange(user, false, io);

    }
  } catch (error) {
    console.error("Error in disconnect event:", error);
  }
});
  
  })
}

module.exports=intiliazeSocket