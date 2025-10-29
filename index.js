require('dotenv').config()
const express=require('express')
const cookieParser=require('cookie-parser');
const connectDB=require('./config/database');
const app=express();
const cors=require('cors');
const http=require('http');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet");
const morgan = require('morgan');
const { startGithubActivityCron }=require('./src/utils/githubcron')
const ratelimit=require('express-rate-limit')
const logger=require('./src/utils/logger')

const passport = require('./src/utils/passport-config');
const allowedOrigins = [
  process.env.liveFrontendURL,
  process.env.localFrontendURL
];

app.use(cors({
  origin: function (origin, callback) {
    
  
    if (!origin) return callback(null, true);

 
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false); 
    }
    
    return callback(null, true); 
  },
  credentials: true
}));

app.use(passport.initialize());
app.use(express.json());
app.use(mongoSanitize());
app.use(helmet());
const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};
app.use(morgan('dev', { stream: morganStream }));
app.use(cookieParser());

const limiter = ratelimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    status: 429,
    message: "Too many requests, please try again later."
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

app.use(limiter)
app.set('trust proxy', 1);

const userRouter=require('./src/router/user.route');
const profileRouter=require('./src/router/profile.router');
const connectionRouter=require('./src/router/connection.router');
const pendingrequestRouter=require('./src/router/showconnection.router');
const projectRouter=require('./src/router/project.router');
const chatRouter=require('./src/router/chat.router')
const paymentRouter=require('./src/router/payment.router')
const intiliazeSocket=require('./src/utils/socket')
const { connectRedis } = require('./src/utils/redis');

app.get('/api/v1/health', async (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      message: 'DevTalks server is healthy 🚀',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
    });
  }
});
app.use('/api/v1/users',userRouter);
app.use('/api/v1/profile',profileRouter);
app.use('/api/v1/connection',connectionRouter);
app.use('/api/v1/pending',pendingrequestRouter);
app.use('/api/v1/project',projectRouter);
app.use('/api/v1/chats',chatRouter)
app.use('/api/v1/payment',paymentRouter)


const server=http.createServer(app)
intiliazeSocket(server)


logger.info("Application starting up...");



connectDB().then(async ()=>{
 logger.debug("Database connection successful.");
  await connectRedis();
  logger.info("Redis connection successful.");
   startGithubActivityCron();
  server.listen(7777,()=>{
  logger.info('Server is running on port 7777');
  })
}).catch((err)=>{
  logger.error('Failed to connect to the database', err); 
  process.exit(1)
});