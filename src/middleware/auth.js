const jwt=require('jsonwebtoken');
const User=require('../models/user.model');
const logger=require('../utils/logger')

const userAuth=async(req,res,next)=>{

  try {
   
    const  token=req.cookies.accessToken ||req.header("Authorization")?.replace("Bearer ", "");

     if (!token) {
      logger.warn(`Unauthorized: Token missing for ${req.method} ${req.originalUrl}`);
            return res.status(401).json({
        success: false,
        message: "Unauthorized request - Token missing",
      });
        }

    const decodedObj=await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
     const _id=decodedObj._id;
     const user=await User.findById(_id).select("-password -refreshToken");
     if(!user){
      logger.warn(`Auth failed: User not found for token ID ${_id}`);
    return res.status(404).json({
        success: false,
        message: "User not found",
      });
     }
     req.user=user;

     logger.debug(`User authenticated: ${user.emailId} (ID: ${user._id})`);
    next();
  } catch (error) {

      if (error.name === "TokenExpiredError") {
          logger.warn(`Auth failed: Token expired for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        message: "jwt expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
    
      logger.warn(`Auth failed: Invalid token for ${req.method} ${req.originalUrl}. Error: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    logger.error(`Auth middleware error: ${error.message}`, { stack: error.stack });
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }

}



const isAdmin = (req, res, next) => {

  if (req.user && req.user.role === 'admin') {
    next(); 
  } else {
    res.status(403).json({ success: false, message: 'Forbidden: Requires admin access' });
  }
};

module.exports={userAuth,isAdmin}