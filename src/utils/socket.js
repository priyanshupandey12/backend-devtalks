const socket = require('socket.io');
const crypto = require('crypto');
const Chat = require('../models/chat.model');
const logger = require('../utils/logger');
const Connection = require('../models/connection.model');
const { setUserOnline, setUserOffline, getSocketIdForUser } = require('../utils/redis.js');

const gethashSocket = (loggedin, userId) => {
  return crypto.createHash("sha256").update([loggedin, userId].sort().join("_")).digest("hex");
};

const allowedSocketOrigins = [
  process.env.liveFrontendURL,
  process.env.localFrontendURL
];

const intiliazeSocket = (server) => {
  logger.info("Socket.io service initializing...");
  const io = socket(server, {
    cors: {
      origin: allowedSocketOrigins,
      credentials: true
    }
  });

  const broadcastStatusChange = async (user, isOnline, io) => {
    try {
      logger.debug(`Broadcasting status (${isOnline}) for user ${user._id}`);
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

  io.on('connection', (socket) => {
    logger.info(`New socket connection: ${socket.id}`);

    const connectedUserId = socket.handshake.query.userId;
    if (connectedUserId) {
      logger.info(`Socket ${socket.id} authenticated for user: ${connectedUserId}`);
      socket.userId = connectedUserId;
      setUserOnline(socket.userId, socket.id);
      socket.join(connectedUserId.toString());
    }

    socket.on('joinchat', ({ loggedin, userId }) => {
      if (!loggedin || !userId) return;
      const roomId = gethashSocket(loggedin, userId);
      logger.debug(`User ${loggedin} (Socket: ${socket.id}) joining chat room: ${roomId}`);
      socket.join(roomId);
    });

    socket.on("announce online", async (userId) => {
      try {
        if (!userId) return;
        logger.info(`User ${userId} announced online with socket ${socket.id}`);
        await setUserOnline(userId, socket.id);
        socket.userId = userId;
        socket.join(userId.toString());

        const connections = await Connection.find({
          $or: [{ fromuserId: userId }, { toconnectionId: userId }],
          status: 'accepted'
        });

        connections.forEach(conn => {
          const friendId = conn.fromuserId.toString() === userId
            ? conn.toconnectionId.toString()
            : conn.fromuserId.toString();

          socket.join(friendId.toString());
          logger.debug(`User ${userId} joined status room for friend ${friendId}`);
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
        if (!userIdToCheck) return;
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

    socket.on('check_users_status', async ({ userIds }) => {
      try {
        if (!Array.isArray(userIds)) return;
        const statusMap = {};
        for (const uid of userIds) {
          const socketId = await getSocketIdForUser(uid);
          statusMap[uid] = !!socketId;
        }
        socket.emit('users_status_response', { statusMap });
      } catch (error) {
        logger.error("Error in 'check_users_status' event", { error: error.message });
      }
    });

    socket.on("outgoing_call", async ({ to, from, channelName }) => {
      try {
        logger.debug(`Outgoing call from ${from} to ${to}`);
        const receiverSocketId = await getSocketIdForUser(to);

        if (receiverSocketId) {
          logger.debug(`Forwarding incoming call from ${from} to user ${to} (socket: ${receiverSocketId})`);
          io.to(receiverSocketId).emit('incoming_call', {
            from: from,
            channelName: channelName
          });
        } else {
          logger.warn(`Call failed: User ${to} is not online. (Caller: ${from})`);
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
    });

    socket.on('sendmessage', async ({ firstName, loggedin, userId, text }) => {
      try {
        if (!loggedin || !userId || !text) return;

        const roomId = gethashSocket(loggedin, userId);
        logger.debug(`Message from ${loggedin} to ${userId} in room ${roomId}`);

        let chat = await Chat.findOne({
          participants: { $all: [loggedin, userId] }
        });

        if (!chat) {
          logger.info(`Creating new chat room for ${loggedin} and ${userId}`);
          chat = await Chat.create({
            participants: [loggedin, userId],
            messages: []
          });
        }
        chat.messages.push({
          senderId: loggedin,
          text,
        });

        await chat.save();

        const lastMsg = chat.messages[chat.messages.length - 1];
        const payload = {
          firstName,
          text,
          senderId: loggedin,
          _id: lastMsg._id,
          createdAt: lastMsg.createdAt,
        };

        // Emit to chat room, recipient's user room, and sender's user room
        io.to(roomId).emit("messageDelivered", payload);
        io.to(userId.toString()).emit("messageDelivered", payload);
        io.to(loggedin.toString()).emit("messageDelivered", payload);

      } catch (error) {
        logger.error("Error in 'sendmessage' event", {
          error: error.message,
          stack: error.stack,
          senderId: loggedin,
          receiverId: userId
        });
      }
    });

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
  });
};

module.exports = intiliazeSocket;