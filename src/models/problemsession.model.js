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
    enum: ['understanding', 'edge_cases', 'brute_force', 'optimal', 'complexity', 'completed'],
    default: 'understanding'
  },
  
  performance: {
    attempts: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
    thinkingTime: { type: Number, default: 0 },
    struggledSteps: [{
      step: { 
        type: String, 
        enum: ['understanding', 'edge_cases', 'brute_force', 'optimal', 'complexity'] 
      },
      struggleLevel: { 
        type: String, 
        enum: ['mild', 'moderate', 'severe'], 
        default: 'mild' 
      },
      timestamp: { type: Date, default: Date.now },
      hintsUsed: { type: Number, default: 0 }
    }]
  },

  lastInteractionAt: { type: Date, default: Date.now },
  
  history: [{
    step: String,
    userSubmission: String,
    feedbackGiven: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });


practiceSessionSchema.pre('save', function(next) {
  if (this.currentStep === 'completed') {
    this.status = 'completed';
  }
  next();
});


practiceSessionSchema.methods.addStruggledStep = function(step, struggleLevel = 'mild', hintsUsed = 0) {
  this.performance.struggledSteps.push({
    step,
    struggleLevel,
    hintsUsed,
    timestamp: new Date()
  });
};


practiceSessionSchema.methods.getStruggleScore = function() {
  const weights = { mild: 1, moderate: 2, severe: 3 };
  return this.performance.struggledSteps.reduce((score, struggle) => {
    return score + weights[struggle.struggleLevel] * (struggle.hintsUsed + 1);
  }, 0);
};


practiceSessionSchema.methods.updateThinkingTime = function() {
  const now = new Date();
  const timeSinceLastInteraction = now - this.lastInteractionAt;
  this.thinkingTime += Math.floor(timeSinceLastInteraction / 1000); 
  this.lastInteractionAt = now;
};


practiceSessionSchema.methods.getCurrentStepStruggleTime = function() {
  const currentStepStruggles = this.performance.struggledSteps.filter(
    s => s.step === this.currentStep
  );
  
  if (currentStepStruggles.length === 0) return 0;
  
  const firstStruggle = currentStepStruggles[0].timestamp;
  const lastStruggle = currentStepStruggles[currentStepStruggles.length - 1].timestamp;
  
  return Math.floor((lastStruggle - firstStruggle) / 1000); 
};

const PracticeSession = mongoose.model('PracticeSession', practiceSessionSchema);
module.exports = PracticeSession;