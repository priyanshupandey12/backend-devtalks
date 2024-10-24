const User=require('../models/user.model');
const {validatesignUpData}=require('../utils/validate');
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken');


const signUp=async(req,res)=>{

 try {
   //validation of user

  validatesignUpData(req);
  
  const{firstName,lastName,emailId,password}=req.body;
   //encrpyted the password
   const passwordhash=await bcrypt.hash(password,10);

   const newUser=await User.create({
    firstName,
    lastName,
    emailId,
    password:passwordhash,
   });

 const saveduser=  await newUser.save();
 const token=await saveduser.getJWTToken();
res.cookie('token',token,{expires:new Date(Date.now()+8 * 6400000)});
   return res.status(200).json({message:'User created successfully',data:saveduser});


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


module.exports={signUp,loginUp,logOut,changePassword}