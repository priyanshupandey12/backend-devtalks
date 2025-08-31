require('dotenv').config()
const express=require('express')
const cookieParser=require('cookie-parser');
const connectDB=require('./config/database');
const app=express();
const cors=require('cors');
const http=require('http');
const { startGithubActivityCron }=require('./src/utils/githubcron')
app.use(cors
  ({
    origin:'http://localhost:5173',
    credentials:true
  }
));
app.use(express.json());
app.use(cookieParser());

const userRouter=require('./src/router/user.route');
const profileRouter=require('./src/router/profile.router');
const connectionRouter=require('./src/router/connection.router');
const pendingrequestRouter=require('./src/router/showconnection.router');
const projectRouter=require('./src/router/project.router');
const chatRouter=require('./src/router/chat.router')
const paymentRouter=require('./src/router/payment.router')
const intiliazeSocket=require('./src/utils/socket')
app.use('/api/v1/users',userRouter);
app.use('/api/v1/profile',profileRouter);
app.use('/api/v1/connection',connectionRouter);
app.use('/api/v1/pending',pendingrequestRouter);
app.use('/api/v1/project',projectRouter);
app.use('/api/v1/chats',chatRouter)
app.use('/api/v1/payment',paymentRouter)



const server=http.createServer(app)
intiliazeSocket(server)






connectDB().then(()=>{
 

   startGithubActivityCron();
  server.listen(7777,()=>{
    console.log('server is running on port 7777')
  })
}).catch((err)=>{
  console.log('database not connected')
  console.log(err)
});