
const mongoose = require('mongoose');


const exampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }
});


const problemSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  topic: { type: String, required: true, index: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  
  constraints: { type: String }, 
  examples: [exampleSchema], 


});

const Problem = mongoose.model('Problem', problemSchema);
module.exports = Problem;