
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
    enum: ['understanding', 'edge_cases', 'pseudocode', 'complexity', 'solution_review'],
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

const PracticeSession = mongoose.model('PracticeSession', practiceSessionSchema);
module.exports = PracticeSession;