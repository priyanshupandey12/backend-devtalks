const socket=require('socket.io')
const crypto=require('crypto');
const Chat = require('../models/chat.model');


const gethashSocket=(loggedin,userId)=>{
   return crypto.createHash("sha256").update([loggedin,userId].sort().join("_")).digest("hex")
}



const intiliazeSocket=(server)=>{
  const io=socket(server,{
    cors:{
      origin:'http://localhost:5173'
    }
  })
  
  io.on('connection',(socket)=>{


    socket.on('joinchat',({loggedin,userId})=>{

      const roomId=gethashSocket(loggedin,userId)

   
      socket.join(roomId);

    })

    socket.on('sendmessage',async({firstName,loggedin,
      userId,
      text})=>{
   

        try {
          const roomId=gethashSocket(loggedin,userId)

          console.log(`${firstName} your message is recieved ${text}`)
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

          io.to(roomId).emit("messageDelivered",{firstName,text})


          
        } catch (error) {
          console.log(error)
        
        }










      })

    socket.on('disconnect',()=>{})
  
  })
}

module.exports=intiliazeSocket