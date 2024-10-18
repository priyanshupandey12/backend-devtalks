
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
    type:String,
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
    text: String,
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],

   category: {
    type: String
  },


   Collaborators: [{ 
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User' 
      }],

    attachments: [{
      fileName: String,
      fileUrl: String,
      uploadDate: Date
      }]
   

},
  {timestamps:true});

const Project=mongoose.model('Project',projectSchema);
 module.exports=Project