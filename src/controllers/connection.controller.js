

const Connection=require('../models/connection.model');
const User=require('../models/user.model');
const sendRequest = async (req, res) => {
  try {
    const fromuserId = req.user._id;
    const toconnectionId = req.params.toconnectionId;
    const status = req.params.status;
    console.log(fromuserId, toconnectionId, status);

    const allowedStatus = ['ignored', 'Interested'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (fromuserId.toString() === toconnectionId) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    const toconnectionIdUser = await User.findById(toconnectionId);
    if (!toconnectionIdUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { fromuserId: fromuserId, toconnectionId: toconnectionId },
        { fromuserId: toconnectionId, toconnectionId: fromuserId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ error: 'Connection already exists' });
    }

    const newConnection = await Connection.create({ fromuserId, toconnectionId, status });

    return res.status(200).json({
      message: `Request sent to ${toconnectionIdUser.firstName} ${toconnectionIdUser.lastName}`,
      data: newConnection
    });
  } catch (error) {
    console.error('Error in sendRequest:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const acceptRequest = async (req, res) => {
  try {
    const loggedInUser = req.user;
    const requestId = req.params.requestId;
    const status = req.params.status;

    const allowedStatus = ['accepted', 'rejected'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connectionRequest = await Connection.findOne({
      _id: requestId,
      toconnectionId: loggedInUser._id,
      status: 'Interested'
    });

    if (!connectionRequest) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    connectionRequest.status = status;
    await connectionRequest.save();

    const message = status === 'accepted' ? 'Request accepted' : 'Request rejected';
    return res.status(200).json({
      message: message,
      data: connectionRequest
    });

  } catch (error) {
    console.error('Error in acceptRequest:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


module.exports = {sendRequest,acceptRequest}


