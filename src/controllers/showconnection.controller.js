const Connection = require('../models/connection.model');
const User = require('../models/user.model');

const showpendingConnection = async (req, res) => {
   

  try {
    const loggedInUser = req.user;
   const status=req.params.status;

    const pendingConnections = await Connection.find({ toconnectionId: loggedInUser._id, status: 'Interested' }).populate('fromuserId',['firstName','lastName']);

 

    return res.status(200).json({
     message: 'pending connections',
     data: pendingConnections
    });
    } catch (error) {
      return res.status(400).json({ error: error.message });
  }
}


const acceptingConnection = async (req, res) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser._id) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    const connectionRequest = await Connection.find({ 
      $or: [
        { fromuserId: loggedInUser._id, status: 'accepted' },
        { toconnectionId: loggedInUser._id, status: 'accepted' }
      ] 
    }).populate('fromuserId', ['firstName', 'lastName', 'photoUrl', 'skills', 'description', 'gender'])
      .populate('toconnectionId', ['firstName', 'lastName', 'photoUrl', 'skills', 'description', 'gender']);

    const data = connectionRequest.reduce((acc, item) => {
      let connection;
      if (item.fromuserId && item.fromuserId._id && item.fromuserId._id.toString() === loggedInUser._id.toString()) {
        connection = item.toconnectionId;
      } else if (item.toconnectionId && item.toconnectionId._id) {
        connection = item.fromuserId;
      }

      if (connection && connection._id) {
        acc.push({
          _id: connection._id,
          firstName: connection.firstName || 'Unknown',
          lastName: connection.lastName || 'User',
          photoUrl: connection.photoUrl || '',
          skills: connection.skills || [],
          description: connection.description || '',
          gender: connection.gender || ''
        });
      }

      return acc;
    }, []);

    return res.status(200).json({
      message: 'Connected users',
      data
    });
  } catch (error) {
    console.error('Error in acceptingConnection:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  } 
}

const choosingCardConnection = async (req, res) => {
try {
  const feedshow=['firstName', 'lastName','photoUrl' ,'skills' ,'description', 'gender']
  const loggedInUser = req.user;
  const page=parseInt(req.query.page) || 1;
  let limit=parseInt(req.query.limit) || 10;
  limit=limit>50?50:limit

  const connectionRequest = await Connection.find({
    $or: 
    [ 
    { fromuserId: loggedInUser._id }, 
    { toconnectionId: loggedInUser._id } 
  ]
  }).select('fromuserId toconnectionId');

  const hidefromfeed= new Set();
  connectionRequest.forEach(req => {
    hidefromfeed.add(req.fromuserId.toString());
    hidefromfeed.add(req.toconnectionId.toString());
  });

   const users = await User.find({
    $and: 
    [
    { _id: { $nin: Array.from(hidefromfeed) } },
    { _id: { $ne: loggedInUser._id } }
    ]
    
    }).select(feedshow).skip((page-1)*limit).limit(limit);  
    
    return res.status(200).json({
      message: 'connected users',
      data: users
    })    
  

} catch (error) {
  return res.status(400).json({ error: error.message });
}
}

module.exports = { showpendingConnection, acceptingConnection, choosingCardConnection};