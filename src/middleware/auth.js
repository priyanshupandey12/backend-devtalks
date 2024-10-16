const jwt=require('jsonwebtoken');
const User=require('../models/user.model');

const userAuth=async(req,res,next)=>{

  try {
    //read the token from cookies
    const  token=req.cookies.token;

    const decodedObj=await jwt.verify(token,'DevTalks2021');
     const _id=decodedObj._id;
     const user=await User.findById(_id);
     if(!user){
      throw new Error('user not found');
     }
     req.user=user;
    next();
  } catch (error) {
    res.status(400).json("ERROR : "+error.message);
  }

}

module.exports={userAuth}