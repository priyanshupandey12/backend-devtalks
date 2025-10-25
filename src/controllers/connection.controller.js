
const Connection=require('../models/connection.model');
const User=require('../models/user.model');
const logger=require('../utils/logger')

const sendRequest = async (req, res) => {
  try {
    const fromuserId = req.user._id;
    const toconnectionId = req.params.toconnectionId;
    const status = req.params.status;
    
logger.debug(`Connection request attempt from ${fromuserId} to ${toconnectionId} with status ${status}`);
    const allowedStatus = ['ignored', 'Interested'];
    if (!allowedStatus.includes(status)) {
      logger.warn(`Invalid status provided by ${fromuserId}: ${status}`);
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (fromuserId.toString() === toconnectionId) {
      logger.warn(`User ${fromuserId} attempted to send connection request to themselves.`);
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    const toconnectionIdUser = await User.findById(toconnectionId);
    if (!toconnectionIdUser) {
      logger.warn(`User ${fromuserId} tried to connect to non-existent user ${toconnectionId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { fromuserId: fromuserId, toconnectionId: toconnectionId },
        { fromuserId: toconnectionId, toconnectionId: fromuserId }
      ]
    });

    if (existingConnection) {
      logger.warn(`Connection already exists between ${fromuserId} and ${toconnectionId}.`);
      return res.status(400).json({ error: 'Connection already exists' });
    }

    

    const newConnection = await Connection.create({ fromuserId, toconnectionId, status });

    logger.info(`Connection request sent successfully from ${fromuserId} to ${toconnectionId} (ID: ${newConnection._id})`);

    return res.status(200).json({
      message: `Request sent to ${toconnectionIdUser.firstName} ${toconnectionIdUser.lastName}`,
      data: newConnection
    });
  } catch (error) {
   logger.error(`Error in sendRequest from ${req.user?._id} to ${req.params?.toconnectionId}: ${error.message}`, {
      stack: error.stack,
      fromuserId: req.user?._id,
      toconnectionId: req.params?.toconnectionId
    });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

const acceptRequest = async (req, res) => {
  try {
    const loggedInUser = req.user;
    const requestId = req.params.requestId;
    const status = req.params.status;

    logger.debug(`Attempt to update connection request ${requestId} to status ${status} by user ${loggedInUser._id}`);

    const allowedStatus = ['accepted', 'rejected'];
    if (!allowedStatus.includes(status)) {
      logger.warn(`Invalid status provided by ${loggedInUser._id}: ${status}`);
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connectionRequest = await Connection.findOne({
      _id: requestId,
      toconnectionId: loggedInUser._id,
      status: 'Interested'
    });

    if (!connectionRequest) {
      logger.warn(`Connection request not found or already processed. RequestID: ${requestId}, User: ${loggedInUser._id}`);
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    connectionRequest.status = status;
    await connectionRequest.save();

    const message = status === 'accepted' ? 'Request accepted' : 'Request rejected';

    logger.info(`Connection request ${requestId} was ${status} by ${loggedInUser._id}`);

    return res.status(200).json({
      message: message,
      data: connectionRequest
    });

  } catch (error) {
     logger.error(`Error in acceptRequest for request ${requestId} by user ${loggedInUser._id}: ${error.message}`, {
      stack: error.stack,
      requestId: requestId,
      userId: loggedInUser._id
    });
    
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}



module.exports = {sendRequest,acceptRequest}


