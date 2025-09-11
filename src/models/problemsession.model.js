
const mongoose = require('mongoose');

const practiceSessionSchema = new mongoose.Schema({

  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  problemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Problem', 
    required: true 
  },
  
  status: { 
    type: String, 
    enum: ['in_progress', 'completed', 'given_up'], 
    default: 'in_progress' 
  },
  
 
  currentStep: {
    type: String,
    enum: ['understanding', 'edge_cases','brute_force', 'optimal','complexity', 'completed'],
    default: 'understanding'
  },
  
    performance: {
    attempts: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
    struggledSteps: [{ type: String }] 
  },


  history: [{
    step: String,
    userSubmission: String,
    feedbackGiven: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });


practiceSessionSchema.pre('save', function(next) {
  if(this.currentStep === 'completed') {
    this.status = 'completed';
  }
  next();
});

const PracticeSession = mongoose.model('PracticeSession', practiceSessionSchema);
module.exports = PracticeSession;