const User=require('../models/user.model');
const {validatesignUpData}=require('../utils/validate');
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken');
const geocodeAddress=require('../utils/geocode');

const signUp=async(req,res)=>{

 try {
   //validation of user

  validatesignUpData(req);

  
  
  const{
     firstName,
      lastName,
      emailId,
      password,   
      gender,
      description,
      photoUrl,
      skills,
      experienceLevel,
      location,
      timezone,
      commitment,
      primaryGoal,
      userRole,
      links}=req.body;
   //encrpyted the password
   const passwordhash=await bcrypt.hash(password,10);

    let geoLocation = {
      type: "Point",
      coordinates: [0, 0],
      address: ""
    };

    if (location) {
      const [lng, lat] = await geocodeAddress(location);
      geoLocation = {
        type: "Point",
        coordinates: [lng, lat],
        address: location
      };
    }

   const newUser=await User.create({
    firstName,
    lastName,
    emailId,
    password:passwordhash,
      gender: gender || "",
      description: description || "",
      photoUrl: photoUrl || "",
     skills: skills || [],
      experienceLevel: experienceLevel || "Beginner",
      location: geoLocation,
      timezone: timezone || "",
      commitment: commitment || { hoursPerWeek: "5-10 hours", projectDuration: "1-3 months" },
      primaryGoal: primaryGoal || "Portfolio Project",
      userRole: userRole || "Looking to Join",
         links: {
        githubUsername: links?.githubUsername || "",
        linkedin: links?.linkedin || "",
        portfolio: links?.portfolio || ""
      },
   });

 const savedUser=  await newUser.save();
 const token=await savedUser.getJWTToken();
res.cookie('token',token,{expires:new Date(Date.now()+8 * 6400000)});
  const userWithoutPassword = savedUser.toObject();
    delete userWithoutPassword.password;

    return res
      .status(200)
      .json({ message: "User created successfully", data: userWithoutPassword });


 }
 
 catch (error) {
  return res.status(400).json("ERROR : "+error.message);
 }
};

const loginUp=async(req,res)=>{

  try {
    const{emailId,password}=req.body;

    const user=await User.findOne({emailId:emailId });

    if(!user) {
    throw new Error('user emailid is not valid');
    }
    const isPasswordValid=await user.verifyPassword(password);
    if(!isPasswordValid) {
      throw new Error('user password is not valid');
    }
   const token=await user.getJWTToken();
   res.cookie('token',token,{expires:new Date(Date.now()+8 * 6400000)});

    return res.status(200).json({user}); 
  } catch (error) {
    return res.status(400).json("ERROR : "+error.message);
  }


};

const logOut=async(req,res)=>{
res.cookie('token',null,{expires:new Date(Date.now())});
return res.status(200).json('logout Succesfully');
}

const changePassword=async(req,res)=>{
  try {
   const {oldPassword,newPassword}=req.body;
   
   if(!oldPassword || !newPassword){
    throw new Error('oldPassword or newPassword is not valid'); 
  }
  const user=req.user;
   const isPasswordValid=await user.verifyPassword(oldPassword);
   
   if(!isPasswordValid){
   throw new Error('oldPassword is not valid'); 
  }

  user.password=await bcrypt.hash(newPassword,10);

  await user.save();
   
  
  return res.status(200).json({message:'password changed successfully',data:user});
  } catch (error) {
    return res.status(400).json("ERROR : "+error.message);
  }

}



const getAllusers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const {
      skills,
      experienceLevel,
      activeWindow,
      locationRadius,
      primaryGoal,
      hoursPerWeek,
      page = 1,
      limit = 10
    } = req.query;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    let filterQuery = {
      _id: { $ne: currentUserId }
    };

    // Apply filters
    if (activeWindow === "7d") {
      filterQuery.isGithubActive7d = true;
    } else if (activeWindow === "3m") {
      filterQuery.isGithubActive3m = true;
    }

    if (experienceLevel) {
      const expLevels = Array.isArray(experienceLevel) ? experienceLevel : experienceLevel.split(',');
      filterQuery.experienceLevel = { $in: expLevels };
    }

    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : skills.split(',');
      filterQuery.skills = {
        $in: skillArray.map(skill => new RegExp(skill.trim(), 'i'))
      };
    }

    if (primaryGoal) {
      const goals = Array.isArray(primaryGoal) ? primaryGoal : primaryGoal.split(',');
      filterQuery.primaryGoal = { $in: goals };
    }

    if (hoursPerWeek) {
      filterQuery['commitment.hoursPerWeek'] = hoursPerWeek;
    }

    let users = [];

   
    if (currentUser.location?.coordinates?.length && parseInt(locationRadius) > 0) {
      users = await User.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: currentUser.location.coordinates },
            distanceField: "distance",
            maxDistance: parseInt(locationRadius) * 1000,
            spherical: true,
            query: filterQuery,
            key: "location.coordinates"
          }
        },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      ]);
    } else {
      
      users = await User.find(filterQuery)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
    }

    if (users.length === 0) {
      return res.status(200).json("User not found");
    }

    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: users.length
      },
      appliedFilters: {
        skills,
        experienceLevel,
        locationRadius: parseInt(locationRadius),
        primaryGoal,
        hoursPerWeek,
        activeWindow
      }
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};


module.exports={signUp,loginUp,logOut,changePassword,getAllusers}