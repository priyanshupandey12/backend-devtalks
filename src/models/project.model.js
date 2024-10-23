
const mongoose=require('mongoose');


const projectSchema=mongoose.Schema({
      
   title:{
    type:String,
    required:true,
    minlength: 3,
    maxlength: 100
   },

   description:{
    type:String,
    required:true,
    minlength: 10,
    maxlength: 1000
   },

   ownerId:{
    type: mongoose.Schema.Types.ObjectId,
     ref:'User',
     required:true
   },

   visibility: {
    type: String,
    required: true,
    enum: ['public', 'private', 'shared'],
    default: 'private'
  },

   status: {
    type: String,
    required: true,
    enum: {
      values: ['In Progress', 'Completed', 'On Hold'],
      message: `{VALUE} is not supported`,
    },
    default: 'In Progress'
  },

   comments: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
          },
      text: 
      {
            type: String,
            required: true,
            minlength: 3,
            maxlength: 500
          },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],

  category: {
    type: [String],
    required: true,
    enum: ['web', 'mobile', 'desktop', 'backend'],
    validate:{
      validator: function(value) {
        return value.length > 0;
      },
      message: 'Please provide at least one category'
    }
  },


  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      required: true
    },
    inviteStatus: {
      type: String,
      enum: 
      {
       values: ['Pending', 'Accepted', 'Rejected'],
        message: `{VALUE} is not supported`
      },
      default: 'Pending'
    }
  }],

  attachments:  [{
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: {
      type: Number,
      required: true,
      min: 1,
      max: 10485760 // Max 10MB
    },
    uploadDate: { type: Date, required: true }
  }]
   

},
  {timestamps:true});


  projectSchema.methods.addCollaborator = async function (collaboratorId, role) {
    const project = this;
    project.collaborators.push({ userId: collaboratorId, role });

    return project;
  };


const Project=mongoose.model('Project',projectSchema);

 module.exports=Project