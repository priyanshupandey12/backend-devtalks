
const mongoose = require('mongoose');


const solutionApproachSchema = new mongoose.Schema({
  approachName: {
    type: String,
    enum: ['Brute-force', 'Better', 'Optimal'],
    required: true
  },
  explanation: { type: String, required: true },
  pseudoCode: { type: String, required: true },
  timeComplexity: { type: String, required: true },
  spaceComplexity: { type: String, required: true },
});


const problemSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  topic: { type: String, required: true, index: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  

  solutions: [solutionApproachSchema],


  hints: {
    understanding: String,
    edgeCases: String,
    optimization: String, 
  },

  similarProblemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }]
});

const Problem = mongoose.model('Problem', problemSchema);
module.exports = Problem;