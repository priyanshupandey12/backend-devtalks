
const mongoose=require('mongoose');
const  bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const userSchema=mongoose.Schema({
  
 googleId: {
type: String,
sparse: true, 
index: true,
},

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
    required: function() {
    return this.authProvider === 'local';
  }
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
    hoursPerWeek: { type: String, default: '' },
    projectDuration: { type: String, default: '' }
  },

  primaryGoal: {
    type: String,
    enum: ['Build a Startup', 'Portfolio Project', 'Learn a New Skill', 'Hackathon', 'Just for Fun','Learning', 'Building Projects', 'Hackathon', 'Networking', 'Job Search'],
  default: undefined 
  },
  userRole: {
    type: String,
    enum: ['Project Owner', 'Looking to Join','Developer','Designer'],
   default: undefined 
  },

  role: {
  type: String,
  enum: ['user', 'admin'],
  default: 'user'
},

  links: {
    githubUsername: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' }
  },
githubActivity: {
  last7dCommits: { type: Number, default: 0 },
  last3mCommits: { type: Number, default: 0 },
  last7dScore: { type: Number, default: 0 },   
  last3mScore: { type: Number, default: 0 }, 
  lastChecked: { type: Date, default: null }
},
isGithubActive7d: { type: Boolean, default: false },
isGithubActive3m: { type: Boolean, default: false },
refreshToken: {
  type: String
  },
  authProvider: {
  type: String,
  enum: ['local', 'google'],
  default: 'local',
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: {
   type: Date,
   default: null,
   },
  loginAttempts: {
   type: Number,
   default: 0,
},
  lockUntil: Date,

},{timestamps:true});

userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ "location.coordinates": "2dsphere" });

userSchema.virtual('isLocked').get(function() {
return !!(this.lockUntil && this.lockUntil > Date.now());
});

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


userSchema.methods.incLoginAttempts = async function() {
try {

if (this.lockUntil && this.lockUntil < Date.now()) {
return this.updateOne({
$unset: { lockUntil: 1 },
$set: { loginAttempts: 1 }
});
}

const updates = { $inc: { loginAttempts: 1 } };


if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; 
}

return this.updateOne(updates);
} catch (error) {
logger.error('Error incrementing login attempts:', error);
throw error;
}
};


userSchema.methods.resetLoginAttempts = async function() {
try {
return this.updateOne({
$unset: { loginAttempts: 1, lockUntil: 1 }
});
} catch (error) {
logger.error('Error resetting login attempts:', error);
throw error;
}
};
const User=mongoose.model('User',userSchema);


module.exports=User