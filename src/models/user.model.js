
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
  } ,
    experienceLevel: {
    type: String,
    enum: ['Student', 'Beginner', 'Intermediate', 'Senior'],
    default: 'Beginner'
  },

 location: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], 
    default: [0, 0]
  },
  address: { type: String, default: '' } 
},
  timezone: {
    type: String, 
    default: ''
  },
  commitment: {
    hoursPerWeek: { type: String, default: '5-10 hours' },
    projectDuration: { type: String, default: '1-3 months' }
  },

  primaryGoal: {
    type: String,
    enum: ['Build a Startup', 'Portfolio Project', 'Learn a New Skill', 'Hackathon', 'Just for Fun'],
    default: 'Portfolio Project'
  },
  userRole: {
    type: String,
    enum: ['Project Owner', 'Looking to Join'],
    default: 'Looking to Join'
  },

  links: {
    githubUsername: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' }
  },
githubActivity: {
  last7dCommits: { type: Number, default: 0 },
  last3mCommits: { type: Number, default: 0 },
  lastChecked: { type: Date, default: null }
},
isGithubActive7d: { type: Boolean, default: false },
isGithubActive3m: { type: Boolean, default: false },
socketid:{
  type:String,
  default:null
},
isOnline:{
  type:Boolean,
  default:false
},
refreshToken: {
  type: String
  }

},{timestamps:true});


userSchema.index({ "location.coordinates": "2dsphere" });


userSchema.methods.generateAccessToken= function () {
       return jwt.sign(
        {_id:this._id},
         process.env.ACCESS_TOKEN_SECRET,
         {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
      )
}
userSchema.methods.generateRefreshToken= function () {
      return jwt.sign(
        {_id:this._id},
         process.env.REFRESH_TOKEN_SECRET,
         {expiresIn:process.env.REFRESH_TOKEN_EXPIRY}
      )
}
userSchema.methods.verifyPassword=async function(passwordbyuser){

  const user=this;
  const hashedPassword=user.password;


  const isMatch=await bcrypt.compare(passwordbyuser,hashedPassword);

  return isMatch
}
const User=mongoose.model('User',userSchema);


module.exports=User