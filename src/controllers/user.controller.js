const User=require('../models/user.model');
const {validatesignUpData,validateloginData}=require('../utils/validate');
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken');
const {RtcTokenBuilder,RtcRole}=require('agora-token')
const logger=require('../utils/logger')


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


const signUp = async (req, res) => {
  
  logger.debug(`Signup attempt for email: ${req.body.emailId}`);


  const validationResult = validatesignUpData(req.body);

  if (!validationResult.success) {

    const firstErrorField = Object.keys(validationResult.errors)[0];
    const firstErrorMessage = validationResult.errors[firstErrorField][0];
    
    logger.warn(`Signup validation failed for ${req.body.emailId}: ${firstErrorMessage}`, {
      allErrors: validationResult.errors 
    });
    
    return res.status(400).json({ 
      success: false,
      message: firstErrorMessage,
      errors: validationResult.errors 
    });
  }

 
  try {

    const {
      firstName,
      lastName,
      emailId,
      password,
      gender,
      educationYear,
      yearsOfExperience
    } = validationResult.data; 

  
    const passwordhash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      emailId,
      password: passwordhash,
      gender: gender || "",
      educationYear,
      yearsOfExperience: yearsOfExperience || 0,
      authProvider: 'local',
    });

    const userWithoutPassword = {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      emailId: newUser.emailId,
      photoUrl: newUser.photoUrl,
      role: newUser.role
    };

 
    logger.info(`New user created: ${newUser.emailId} (ID: ${newUser._id})`);

    return res
      .status(201) 
      .json({ message: "User created successfully", data: userWithoutPassword });

  } catch (error) {

    if (error.code === 11000) {
      logger.warn(`Signup failed: Email already in use: ${req.body.emailId}`);
      return res.status(409).json({ 
        success: false,
        message: "This email address is already registered."
      });
    }

  
    logger.error(`Unhandled error in user signup for ${req.body.emailId}: ${error.message}`, {
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: "An internal server error occurred. Please try again later."
    });
  }
};

const loginUp=async(req,res)=>{

  const validationResult=validateloginData(req.body);
  if(!validationResult.success) {
        const firstErrorField = Object.keys(validationResult.errors)[0];
    const firstErrorMessage = validationResult.errors[firstErrorField][0];
    
    logger.warn(`login validation failed for ${req.body.emailId}: ${firstErrorMessage}`, {
      allErrors: validationResult.errors 
    });
    
    return res.status(400).json({ 
      success: false,
      message: firstErrorMessage,
      errors: validationResult.errors 
    });
  }

  const{emailId,password} = validationResult.data;

  try {
    logger.debug(`Login attempt for email: ${emailId}`);

    const user=await User.findOne({emailId:emailId });

  

     if (user.lockUntil && user.lockUntil > Date.now()) {
   logger.warn(`Login failed: Account locked for ${emailId}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Account locked. Please try again later.' 
      });
       }

   const isPasswordValid = user ? await user.verifyPassword(password) : false;

    if (!user || !isPasswordValid) {
      if (user) {

        await user.incLoginAttempts();
        logger.warn(`Login failed: Invalid password for ${emailId}. Attempt ${user.loginAttempts}`);
      } else {
       
        logger.warn(`Login failed: User not found for ${emailId}`);
      }
      

      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

 
    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);
    
  
const loggedInUser = {
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  emailId: user.emailId,
  photoUrl: user.photoUrl,
  role: user.role,
  userRole: user.userRole,
  experienceLevel: user.experienceLevel,
  skills: user.skills,
  gender:user.gender,
  educationYear: user.educationYear,
  collegeName: user.collegeName,
  fieldOfStudy: user.fieldOfStudy,
  primaryGoal: user.primaryGoal,
  links: user.links,
  description: user.description,
  rating: user.rating,
  verified: user.verified
}; 
const accessTokenOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none',
  maxAge: 15 * 60 * 1000 
};

const refreshTokenOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000 
};

logger.info(`Login successful for ${emailId} (ID: ${user._id})`);

return res
  .status(200)
  .cookie("accessToken", accessToken, accessTokenOptions)
  .cookie("refreshToken", refreshToken, refreshTokenOptions)
  .json({ user: loggedInUser });
  } catch (error) {
   logger.error(`Unhandled error in login for ${emailId}: ${error.message}`, {
      stack: error.stack
    });

    return res.status(500).json({ 
      success: false,
      message: "An internal server error occurred. Please try again later."
    });
  
  }


};

const logOut = async (req, res) => {

  try {

    logger.debug(`Logout attempt for user: ${req.user.emailId} (ID: ${req.user._id})`);

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
    );

  
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    };


    logger.info(`User logged out successfully: ${req.user.emailId} (ID: ${req.user._id})`);


    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ success: true, message: "Logout successful" });

  } catch (error) {

    const userId = req.user ? req.user._id : 'UNKNOWN';
    logger.error(`Error during logout for user ID ${userId}: ${error.message}`, {
      stack: error.stack
    });


    return res.status(500).json({
      success: false,
      message: "An internal server error occurred."
    });
  }
};


const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    logger.warn("Refresh token failed: No token provided.");
    return res.status(401).json({ error: "Unauthorized request" });
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
  };

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
 
      logger.warn(`Refresh token failed: User not found for token ID ${decodedToken?._id}`);
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

if (incomingRefreshToken !== user?.refreshToken) {
   
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
      
      logger.error(`FORBIDDEN (Token Reuse): Stolen refresh token detected for user ${user.emailId} (ID: ${user._id}). Session revoked.`);
      
      res.clearCookie("accessToken", options);
      res.clearCookie("refreshToken", options);
      return res.status(403).json({ success: false, message: "Forbidden. Session compromised." });
    }



   
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

     user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

 
    logger.info(`Access token refreshed for user: ${user.emailId} (ID: ${user._id})`);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        success: true,
        message: "Access token refreshed",
        accessToken,
      });
  } catch (error) {
 logger.warn(`Refresh token failed: ${error.message}.`);
    
 
    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);
    
 
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

const changePassword = async (req, res) => {

  const userId = req.user._id;
  const userEmail = req.user.emailId;

  try {
    const { oldPassword, newPassword } = req.body;

  
    if (!oldPassword || !newPassword) {
      logger.warn(`Change password failed: Missing fields for user ${userEmail} (ID: ${userId})`);
      return res.status(400).json({ 
        success: false, 
        message: 'Both oldPassword and newPassword are required.' 
      });
    }

   
    const user = req.user; 
    const isPasswordValid = await user.verifyPassword(oldPassword);

    if (!isPasswordValid) {
    
      logger.warn(`Change password failed: Invalid old password for user ${userEmail} (ID: ${userId})`);
      return res.status(401).json({ 
        success: false, 
        message: 'The old password you entered is incorrect.' 
      });
    }


    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();


    logger.info(`Password changed successfully for user ${userEmail} (ID: ${userId})`);


    return res.status(200).json({ 
      success: true, 
      message: 'Password changed successfully' 
    });

  } catch (error) {
  
    logger.error(`Unhandled error in changePassword for user ${userEmail} (ID: ${userId}): ${error.message}`, {
      stack: error.stack
    });

    return res.status(500).json({ 
      success: false,
      message: "An internal server error occurred. Please try again later."
    });
  }
};


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