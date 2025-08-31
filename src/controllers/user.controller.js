const User=require('../models/user.model');
const {validatesignUpData}=require('../utils/validate');
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken');
const geocodeAddress=require('../utils/geocode');
const {RtcTokenBuilder,RtcRole}=require('agora-token')

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


const generateAgoraToken=async(req,res)=>{
  
    try {
       const { channelName } = req.body;
         const uid = 0; 
    
           if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }
     
     const APP_ID = process.env.AGORA_APP_ID;
    const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
      const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; 
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
        const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );

     return res.status(200).json({ token });
    } catch (error) {
       console.error("Error generating Agora token:", error);
    return res.status(500).json({ error: 'Failed to generate token' });
    }
}


module.exports={signUp,loginUp,logOut,changePassword,generateAgoraToken}