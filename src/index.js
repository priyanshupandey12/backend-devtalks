const express=require('express')
const cookieParser=require('cookie-parser');
const connectDB=require('../config/database');
const app=express();
const cors=require('cors');
app.use(cors
  ({
    origin:'http://localhost:5173',
    credentials:true
  }
));
app.use(express.json());
app.use(cookieParser());

const userRouter=require('../src/router/user.route');
const profileRouter=require('../src/router/profile.router');
const connectionRouter=require('../src/router/connection.router');
const pendingrequestRouter=require('../src/router/showconnection.router');

app.use('/api/v1/users',userRouter);
app.use('/api/v1/profile',profileRouter);
app.use('/api/v1/connection',connectionRouter);
app.use('/api/v1/pending',pendingrequestRouter);

connectDB().then(()=>{
  console.log('database connected')
  app.listen(7777,()=>{
    console.log('server is running on port 7777')
  })
}).catch((err)=>{
  console.log('database not connected')
  console.log(err)
});