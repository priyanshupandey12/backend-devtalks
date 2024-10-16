
const mongoose=require('mongoose');
const  bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const userSchema=mongoose.Schema({


  firstName:{
    type:String,
    required:true,
    minLength:3,
    maxLength:20,
  },
  lastName:{
    type:String,
    required:true
  },
  emailId:{
    type:String,
    required:true,
    unique:true,
    trim:true
  },
  password:{
    type:String,
    required:true
  },

  gender:{
    type:String
  },
  description:{
    type:String
  },
  photoUrl:{
    type:String,
    default:"",
  },
  skills:{
    type:[String],
  }

},{timestamps:true});


userSchema.methods.getJWTToken=async function(){
  const user=this;
  const token=await jwt.sign(
    {_id:user._id},
    'DevTalks2021',
    {expiresIn:'1d'}); 

    return token;
}
userSchema.methods.verifyPassword=async function(passwordbyuser){

  const user=this;
  const hashedPassword=user.password;
  console.log('Verifying password');
  console.log('Stored password hash:', hashedPassword);
  const isMatch=await bcrypt.compare(passwordbyuser,hashedPassword);
  console.log('Password match:', isMatch);
  return isMatch
}
const User=mongoose.model('User',userSchema);


module.exports=User