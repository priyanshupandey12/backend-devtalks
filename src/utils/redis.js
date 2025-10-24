const {createClient}=require("redis")
const logger = require('../utils/logger');
const client = createClient();

client.on('error', (err) => console.log('Redis Client Error', err));

 const connectRedis = async () => {
if (!client.isOpen) {
    try {
 
      await client.connect();
 
      logger.info('Successfully connected to Redis!');
    } catch (err) {
      logger.error('Failed to connect to Redis', err);
      process.exit(1); 
    }
  }
};


const setUserOnline = async (userId, socketId) => {
  try {
 
    await client.set(`user:${userId}`, socketId);
    logger.debug(`Set user ${userId} online in Redis`);
  } catch (err) {
    logger.error(`Failed to set user ${userId} online in Redis`, err);
  }
};

const setUserOffline = async (userId) => {
  try {
   
    await client.del(`user:${userId}`);
    logger.debug(`Set user ${userId} offline in Redis`);
  } catch (err) {
    logger.error(`Failed to set user ${userId} offline in Redis`, err);
  }
};

const getSocketIdForUser = async (userId) => {
  try {
   
    return await client.get(`user:${userId}`);
  } catch (err) {
    logger.error(`Failed to get socket ID for user ${userId} from Redis`, err);
    return null; 
  }
};

module.exports={client,connectRedis,getSocketIdForUser,setUserOffline,setUserOnline}