const User=require('../models/user.model');
const {validatesignUpData}=require('../utils/validate');
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken');
const geocodeAddress=require('../utils/geocode');
const {RtcTokenBuilder,RtcRole}=require('agora-token')


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
         throw new Error("Token generation failed: " + error.message);
    }
}


const signUp=async(req,res)=>{

 try {
  

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
      experienceLevel: experienceLevel,
      location: geoLocation,
      timezone: timezone ,
      commitment: commitment,
      primaryGoal: primaryGoal ,
      userRole: userRole ,
         links: {
        githubUsername: links?.githubUsername || "",
        linkedin: links?.linkedin || "",
        portfolio: links?.portfolio || ""
      },
   });

 const savedUser=  await newUser.save();
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

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

     const options = {
        httpOnly: true,
        secure: true
    }

     return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({ user: loggedInUser}); 
  } catch (error) {
    return res.status(400).json("ERROR : "+error.message);
  }


};

const logOut=async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json('logout Succesfully')

}


const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ error: "Unauthorized request" });
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        user.refreshToken = undefined;
         return res.status(403).json({ error: "Forbidden. Token reuse detected." });
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

   
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        message: "Access token refreshed",
        accessToken,
        refreshToken: newRefreshToken
      });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};
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


module.exports={signUp,loginUp,logOut,changePassword,generateAgoraToken,refreshAccessToken}