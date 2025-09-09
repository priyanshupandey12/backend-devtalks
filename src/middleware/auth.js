const jwt=require('jsonwebtoken');
const User=require('../models/user.model');

const userAuth=async(req,res,next)=>{

  try {
   
    const  token=req.cookies.accessToken ||req.header("Authorization")?.replace("Bearer ", "");

     if (!token) {
            return res.status(401).json({
        success: false,
        message: "Unauthorized request - Token missing",
      });
        }

    const decodedObj=await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
     const _id=decodedObj._id;
     const user=await User.findById(_id).select("-password -refreshToken");
     if(!user){
    return res.status(404).json({
        success: false,
        message: "User not found",
      });
     }
     req.user=user;
    next();
  } catch (error) {
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