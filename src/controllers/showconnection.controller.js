const Connection = require('../models/connection.model');
const User = require('../models/user.model');

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
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser._id) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    const connectionRequest = await Connection.find({ 
      $or: [
        { fromuserId: loggedInUser._id, status: 'accepted' },
        { toconnectionId: loggedInUser._id, status: 'accepted' }
      ] 
    }).populate('fromuserId', ['firstName', 'lastName', 'photoUrl', 'skills', 'description', 'gender','isOnline'])
      .populate('toconnectionId', ['firstName', 'lastName', 'photoUrl', 'skills', 'description', 'gender','isOnline']);

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

// const choosingCardConnection = async (req, res) => {
//  try {
//     const currentUserId = req.user._id;

//     // Extract query parameters
//     const {
//       skills,
//       experienceLevel,
//       activeWindow,
//       locationRadius,
//       primaryGoal,
//       hoursPerWeek,
//       page = 1,
//       limit = 10,
//       useAdvancedFilters = false 
//     } = req.query;

//     const useAdvancedFiltersFlag = useAdvancedFilters === 'true';
//     const currentUser = await User.findById(currentUserId);
//     if (!currentUser) {
//       return res.status(404).json({
//         success: false,
//         message: "Current user not found"
//       });
//     }

//     // STEP 1: Always exclude users with existing connections
//     const connectionRequests = await Connection.find({
//       $or: [
//         { fromuserId: currentUserId },
//         { toconnectionId: currentUserId }
//       ]
//     }).select('fromuserId toconnectionId');

//     const excludeUserIds = new Set();
//     connectionRequests.forEach(req => {
//       excludeUserIds.add(req.fromuserId.toString());
//       excludeUserIds.add(req.toconnectionId.toString());
//     });

//     // STEP 2: Build base query (always exclude connected users + self)
//     let filterQuery = {
//       _id: { 
//         $nin: Array.from(excludeUserIds),
//         $ne: currentUserId 
//       }
//     };

//     // STEP 3: Apply advanced filters only if requested
//     if (useAdvancedFiltersFlag) {
      
//       // GitHub Activity Filter
//       if (activeWindow === "7d") {
//         filterQuery.isGithubActive7d = true;
//       } else if (activeWindow === "3m") {
//         filterQuery.isGithubActive3m = true;
//       }

//       // Experience Level Filter
//       if (experienceLevel) {
//         const expLevels = Array.isArray(experienceLevel) 
//           ? experienceLevel 
//           : experienceLevel.split(',');
//         filterQuery.experienceLevel = { $in: expLevels };
//       }

//       // Skills Filter
//       if (skills) {
//         const skillArray = Array.isArray(skills) 
//           ? skills 
//           : skills.split(',');
//         filterQuery.skills = {
//           $in: skillArray.map(skill => new RegExp(skill.trim(), 'i'))
//         };
//       }

//       // Primary Goal Filter
//       if (primaryGoal) {
//         const goals = Array.isArray(primaryGoal) 
//           ? primaryGoal 
//           : primaryGoal.split(',');
//         filterQuery.primaryGoal = { $in: goals };
//       }

//       // Hours per Week Filter
//       if (hoursPerWeek) {
//         filterQuery['commitment.hoursPerWeek'] = hoursPerWeek;
//       }
//     }

//     // STEP 4: Determine which fields to return
//     const feedFields = [
//       'firstName', 
//       'lastName', 
//       'photoUrl', 
//       'skills', 
//       'description', 
//       'gender',
//       'experienceLevel',
//       'primaryGoal',
//       'commitment',
//       'location',
//       'isGithubActive7d',
//       'isGithubActive3m'
//     ];

//     let users = [];
//     let totalCount = 0;

//     // STEP 5: Execute query (with or without location-based search)
//     const parsedLimit = Math.min(parseInt(limit), 50); // Max 50 users per request
//     const skip = (parseInt(page) - 1) * parsedLimit;

//     if ( useAdvancedFiltersFlag &&
//         currentUser.location?.coordinates?.length && 
//         parseInt(locationRadius) > 0) {
      
//       // Use geospatial query for location-based search
//       const geoQuery = [
//         {
//           $geoNear: {
//             near: { type: "Point", coordinates: currentUser.location.coordinates },
//             distanceField: "distance",
//             maxDistance: parseInt(locationRadius) * 1000, // Convert km to meters
//             spherical: true,
//             query: filterQuery,
//             key: "location.coordinates"
//           }
//         },
//         { $skip: skip },
//         { $limit: parsedLimit },
//         { $project: feedFields.reduce((acc, field) => ({ ...acc, [field]: 1, distance: 1 }), {}) }
//       ];

//       users = await User.aggregate(geoQuery);
      
//       // Get total count for pagination (without skip/limit)
//       const countQuery = [
//         {
//           $geoNear: {
//             near: { type: "Point", coordinates: currentUser.location.coordinates },
//             distanceField: "distance",
//             maxDistance: parseInt(locationRadius) * 1000,
//             spherical: true,
//             query: filterQuery,
//             key: "location.coordinates"
//           }
//         },
//         { $count: "total" }
//       ];
      
//       const countResult = await User.aggregate(countQuery);
//       totalCount = countResult[0]?.total || 0;

//     } else {
//       // Use regular query
//       users = await User.find(filterQuery)
//         .select(feedFields.join(' '))
//         .skip(skip)
//         .limit(parsedLimit)
//         .lean(); // Use lean() for better performance

//       totalCount = await User.countDocuments(filterQuery);
//     }

//     // STEP 6: Handle empty results
//     if (users.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: useAdvancedFilters === 'true' 
//           ? "No users found matching your filters" 
//           : "No more users available",
//         users: [],
//         pagination: {
//           current: parseInt(page),
//           limit: parsedLimit,
//           total: totalCount,
//           totalPages: Math.ceil(totalCount / parsedLimit),
//           hasNext: false,
//           hasPrev: parseInt(page) > 1
//         },
//         appliedFilters: useAdvancedFilters === 'true' ? {
//           skills: skills ? (Array.isArray(skills) ? skills : skills.split(',')) : [],
//           experienceLevel: experienceLevel ? (Array.isArray(experienceLevel) ? experienceLevel : experienceLevel.split(',')) : [],
//           locationRadius: parseInt(locationRadius) || null,
//           primaryGoal: primaryGoal ? (Array.isArray(primaryGoal) ? primaryGoal : primaryGoal.split(',')) : [],
//           hoursPerWeek,
//           activeWindow
//         } : null
//       });
//     }

//     // STEP 7: Return successful response
//     const totalPages = Math.ceil(totalCount / parsedLimit);
    
//     res.status(200).json({
//       success: true,
//       message: `Found ${users.length} users`,
//       users,
//       pagination: {
//         current: parseInt(page),
//         limit: parsedLimit,
//         total: totalCount,
//         totalPages,
//         hasNext: parseInt(page) < totalPages,
//         hasPrev: parseInt(page) > 1
//       },
//       appliedFilters: useAdvancedFilters === 'true' ? {
//         skills: skills ? (Array.isArray(skills) ? skills : skills.split(',')) : [],
//         experienceLevel: experienceLevel ? (Array.isArray(experienceLevel) ? experienceLevel : experienceLevel.split(',')) : [],
//         locationRadius: parseInt(locationRadius) || null,
//         primaryGoal: primaryGoal ? (Array.isArray(primaryGoal) ? primaryGoal : primaryGoal.split(',')) : [],
//         hoursPerWeek,
//         activeWindow
//       } : null
//     });

//   } catch (error) {
//     console.error("Error in getFeed:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
//     });
//   }
// }

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

        const excludeUserIds = new Set(
            connectionRequests.flatMap(req => [req.fromuserId.toString(), req.toconnectionId.toString()])
        );

        
        let filterQuery = {
            _id: { $nin: Array.from(excludeUserIds) } 
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
             distance: 1 
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
                        spherical: true
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