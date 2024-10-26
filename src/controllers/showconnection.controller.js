const Connection = require('../models/connection.model');
const User = require('../models/user.model');

const showpendingConnection = async (req, res) => {
   

  try {
    const loggedInUser = req.user;


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

const mutualConnection = async (req, res) => {
    // 1. Get the currently logged-in user from the request.
  // 2. Get the ID of the other user from the request parameters
 //3. Fetch the connections of the logged-in user (their friends).
 //4. Fetch the connections of the other user (the user whose connections we want to check).
  // 5. Create a Set of IDs for the logged-in user's friends.
 // 6. Get mutual connections by filtering the other user's connections.
  // 7. Fetch the user data for the mutual connections found.


   try {
  
    const loggedInUser = req.user; // Logged-in user details

 
     const otherUserId = req.params.id; // ID of the user whose connections we want to check

     if(!loggedInUser){
     
        return res.status(400).json({ message: "User is not authenticated" });
     }


 //  loggedInUserConnections = Tumhare apne friends.
     const loggedInUserConnections =await Connection.find({
      $or:
      [
         
        // a. Check if the logged-in user sent friend requests that are accepted.

        {fromuserId:loggedInUser._id, status:'accepted'},

        // b. Check if the logged-in user received friend requests that are accepted.

        {toconnectionId:loggedInUser._id, status:'accepted'}

      ]
     })
  

  //otherUserConnections = Us dusre user ke friends jisko tum dekh rahe ho.
     const otherUserConnections = await Connection.find({

      $or:
      [
   // a. Check if the other user sent friend requests that are accepted.
    
      { fromuserId: otherUserId, status: 'accepted' },

     // b. Check if the other user received friend requests that are accepted.
     
       { toconnectionId: otherUserId, status: 'accepted' }
        
    ] 
        })

       //yha kisne kiso request bheji hain yh check krke uski id store krna hain

     const loggedInUserIds = new Set(loggedInUserConnections.map(connection => 
           
    // a. If the connection's fromuserId matches the logged-in user's ID,
    
       connection.fromuserId.toString() === loggedInUser._id.toString() 
      
       //    take the toconnectionId (friend).
   
       ? connection.toconnectionId.toString() 
      
       // b. Otherwise, take the fromuserId (the friend).
    
       : connection.fromuserId.toString()
    
       )); 


       //yha kisne kiso request bheji hain yh check krke uski id store krna hain

        const mutualConnectionIds = otherUserConnections
        .map(conn =>

       // a. If the connection's fromuserId is the other user's ID,
     
          
       conn.fromuserId.toString() === otherUserId ? 
       
       //take the toconnectionId (friend).
         
       conn.toconnectionId.toString() : 
           
       // b. Otherwise, take the fromuserId (the friend).
        
       conn.fromuserId.toString())
       
       .filter(id => loggedInUserIds.has(id));// c. Keep only the IDs that are in the logged-in user's friends.

     
   const mutualConnectionData = await User.find(
    { 
      _id: { $in: mutualConnectionIds } 
    }).select(['firstName', 'lastName', 'photoUrl']);
        
        
  return res.status(200)
  .json({ message: 'Mutual connections', data: mutualConnectionData });
   
   } catch (error) {
    
    console.error('Error in findMutualConnections:', error);
    return res.status(500).json({ error: 'Internal server error' });
   }


}



module.exports = { showpendingConnection, acceptingConnection, choosingCardConnection, mutualConnection};




/*
loggedInUserConnections:
Tumhari (logged-in user) connection list me wo sab log fetch ho jayenge jinke sath tumhara status: 'accepted' hai.
Agar tumne kisi ko friend request bheji aur usne accept kar li (tum fromuserId ho), ya phir kisi ne tumhe request bheji aur tumne accept kar liya (tum toconnectionId ho), wo sab iss list me aa jayenge.
Example: Agar tum A ho aur tumhare friends B, C, aur D hain (jinse tumhara status "accepted" hai), to ye code A ke friends B, C, aur D ko list kar dega.  



Ye dusre user ke friends ko check kar raha hai (maan lo ki dusra user “B” hai). Tum ye dekhna chahte ho ki jo dusra user (B) hai, uske connections me kaun log hain.

otherUserConnections:
Isme wo connections fetch honge jo B ke sath "accepted" status me hain.
Yaani, ya to B ne kisi ko request bheji thi aur accept ho gayi, ya kisi ne B ko bheji thi aur usne accept ki thi.




*/