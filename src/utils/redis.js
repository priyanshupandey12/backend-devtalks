const {createClient}=require("redis")

const client = createClient();

client.on('error', (err) => console.log('Redis Client Error', err));

 const connectRedis = async () => {
    if (!client.isOpen) {
        await client.connect();
        console.log('Successfully connected to Redis!');
    }
};


 const setUserOnline = async (userId, socketId) => {
    await client.set(`user:${userId}`, socketId);
}


 const setUserOffline = async (userId) => {
    await client.del(`user:${userId}`);
};

 const getSocketIdForUser = async (userId) => {
    return await client.get(`user:${userId}`);
};

module.exports={client,connectRedis,getSocketIdForUser,setUserOffline,setUserOnline}