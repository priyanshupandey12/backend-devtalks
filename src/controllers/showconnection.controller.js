const { regex } = require('zod');
const Connection = require('../models/connection.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

const showpendingConnection = async (req, res) => {
   

  try {
    const loggedInUser = req.user;


    const pendingConnections = await Connection.find({ toconnectionId: loggedInUser._id, status: 'Interested' }).populate('fromuserId',['firstName','lastName','photoUrl']);

 

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
      const { lastActive, skills, sort = 'firstName', order = 'asc', page = 1, limit = 10,searchName } = req.query;
    const pageNum=Math.max(parseInt(page) ,1)
    const limitNum=Math.min(parseInt(limit) ,10)
    const skip=(pageNum-1)*limitNum
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser._id) {
      return res.status(400).json({ error: "Invalid user data" });
    }

   
    const acceptedConnections  = await Connection.find({ 
      $or: [
        { fromuserId: loggedInUser._id, status: 'accepted' },
        { toconnectionId: loggedInUser._id, status: 'accepted' }
      ] 
    })

    

   const userIDs=acceptedConnections.map(conn=>
    conn.fromuserId.toString()===loggedInUser._id.toString()? conn.toconnectionId.toString() :conn.fromuserId.toString()
  )

    const filter={_id:{$in:userIDs}};

    if(skills) {
      const skillList=skills.split(',').map(skill=>skill.trim());
        filter.skills= { 
    $elemMatch: { $regex: skillList.join('|'), $options: 'i' } 
  };
    }

        if (lastActive) {
      const days = parseInt(lastActive);
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      filter.lastLogin = { $gte: threshold };
    }

    if(searchName) {
      filter.firstName={$regex:`^${searchName}`,$options:'i'}
    }

 const sortCondition = {};
    sortCondition[sort] = order === 'asc' ? 1 : -1;


    const connectedUsers = await User.find(filter)
      .select('firstName lastName photoUrl skills description primaryGoal userRole lastLogin')
      .sort(sortCondition)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      message: 'Connected users',
      total,
      page: pageNum,
      limit: limitNum,
      data: connectedUsers
    });

  } catch (error) {
    console.error('Error in acceptingConnection:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  } 
}




const choosingCardConnection = async (req, res) => {
    try {
        const currentUserId = req.user._id;

     
        const {
            skills,
            experienceLevel,
            activeWindow,
            primaryGoal,
            hoursPerWeek,
        } = req.query;

        const useAdvancedFilters = req.query.useAdvancedFilters === 'true';
        const pageNum = parseInt(req.query.page) || 1;
        const limitNum = Math.min(parseInt(req.query.limit) || 10, 50); 
        const radiusKm = parseInt(req.query.locationRadius) || 0;
        const skip = (pageNum - 1) * limitNum;

        const currentUser = await User.findById(currentUserId).lean(); 
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "Current user not found" });
        }

      
        const connectionRequests = await Connection.find({
            $or: [{ fromuserId: currentUserId }, { toconnectionId: currentUserId }]
        }).select('fromuserId toconnectionId').lean();

          const excludeUserIds = new Set([currentUserId.toString()]);
        connectionRequests.forEach(req => {
            excludeUserIds.add(req.fromuserId.toString());
            excludeUserIds.add(req.toconnectionId.toString());
        });

          const excludeObjectIds = Array.from(excludeUserIds).map(id => new mongoose.Types.ObjectId(id));
      
        let filterQuery = {
            _id: { $nin: Array.from(excludeUserIds) } ,
               ...(useAdvancedFilters && radiusKm > 0 ? {
                'location.coordinates': { $ne: [0, 0] }
            } : {})
        };

      
        if (useAdvancedFilters) {
            if (activeWindow === "7d") filterQuery.isGithubActive7d = true;
            if (activeWindow === "3m") filterQuery.isGithubActive3m = true;
            if (hoursPerWeek) filterQuery['commitment.hoursPerWeek'] = hoursPerWeek;

            if (experienceLevel) {
                const expLevels = Array.isArray(experienceLevel) ? experienceLevel : experienceLevel.split(',');
                filterQuery.experienceLevel = { $in: expLevels };
            }

            if (skills) {
                const skillArray = Array.isArray(skills) ? skills : skills.split(',');
                filterQuery.skills = { $in: skillArray.map(skill => new RegExp(skill.trim(), 'i')) };
            }

            if (primaryGoal) {
                const goals = Array.isArray(primaryGoal) ? primaryGoal : primaryGoal.split(',');
                filterQuery.primaryGoal = { $in: goals };
            }
        }
        
     
        const feedFields = {
             _id: 1, firstName: 1, lastName: 1, photoUrl: 1, skills: 1,
             description: 1, gender: 1, experienceLevel: 1, primaryGoal: 1,
             commitment: 1, location: 1, isGithubActive7d: 1, isGithubActive3m: 1,
             distance: 1 ,userRole:1,
               "githubActivity.last7dCommits": 1,
               "githubActivity.last3mCommits": 1,
                 "githubActivity.lastChecked": 1
        };

        let users = [];
        let totalCount = 0;

        // STEP 6: Execute the query
        const hasLocationFilter = useAdvancedFilters && currentUser.location?.coordinates?.length && radiusKm > 0;

        if (hasLocationFilter) {
           
            const geoAggregation = [
                {
                    $geoNear: {
                        near: { type: "Point", coordinates: currentUser.location.coordinates },
                        distanceField: "distance",
                        maxDistance: radiusKm * 1000, 
                        query: filterQuery,
                         key: "location.coordinates",
                        spherical: true
                    }
                },
                   {
        $match: {
            _id: { $nin: excludeObjectIds }  
        }
    },
                {
                    $facet: {
                        data: [
                            { $skip: skip },
                            { $limit: limitNum },
                            { $project: feedFields }
                        ],
                        metadata: [{ $count: "total" }]
                    }
                }
            ];
            const result = await User.aggregate(geoAggregation);
            users = result[0].data;
            totalCount = result[0].metadata[0]?.total || 0;

        } else {
          
            users = await User.find(filterQuery)
                .select(Object.keys(feedFields).join(' '))
                .skip(skip)
                .limit(limitNum)
                .lean();
            totalCount = await User.countDocuments(filterQuery);
        }

     
        const totalPages = Math.ceil(totalCount / limitNum);
        const pagination = {
            current: pageNum,
            limit: limitNum,
            total: totalCount,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        };

        const appliedFilters = useAdvancedFilters ? {
             skills: skills ? (Array.isArray(skills) ? skills : skills.split(',')) : [],
             experienceLevel: experienceLevel ? (Array.isArray(experienceLevel) ? experienceLevel : experienceLevel.split(',')) : [],
             locationRadius: radiusKm || null,
             primaryGoal: primaryGoal ? (Array.isArray(primaryGoal) ? primaryGoal : primaryGoal.split(',')) : [],
             hoursPerWeek,
             activeWindow
        } : null;

        res.status(200).json({
            success: true,
            message: totalCount > 0 ? `Found ${totalCount} matching users` : "No users found matching your criteria",
            users,
            pagination,
            appliedFilters
        });

    } catch (error) {
        console.error("Error in choosingCardConnection:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : "An error occurred"
        });
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



