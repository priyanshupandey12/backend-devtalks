const PracticeSession = require('../models/problemsession.model');
const aiMentor=require('../utils/openai.cjs');
const mongoose = require('mongoose');
const Problem=require('../models/problem.model')


const startSession = async (req, res) => {
try {
    const { problemId } = req.body;
    const userId = req.user?._id; 

 
    if (!problemId) {
      return res.status(400).json({ success: false, message: "Problem ID is required." });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. User not found." });
    }


    const problemExists = await Problem.findById(problemId);
    if (!problemExists) {
      return res.status(404).json({ success: false, message: "Problem not found." });
    }

  
    const existingSession = await PracticeSession.findOne({
      userId,
      problemId,
      status: "in_progress",
    });

    if (existingSession) {
    
      const now = new Date();
      const timeSinceLastInteraction = now - existingSession.lastInteractionAt;
      existingSession.performance.thinkingTime += Math.floor(timeSinceLastInteraction / 1000);
      existingSession.lastInteractionAt = now;
      await existingSession.save();

      return res.status(200).json({
        success: true,
        data: existingSession,
        message: "Resuming existing session.",
      });
    }

  
    const newSession = new PracticeSession({
      userId,
      problemId,
      history: [{
        step: 'understanding',
        userSubmission: 'Session started',
        feedbackGiven: 'Welcome! Let\'s begin by understanding the problem.'
      }]
    });

    await newSession.save();

    return res.status(201).json({
      success: true,
      data: newSession,
      message: "New session started.",
    });

  } catch (error) {
    console.error("Error in startSession:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


const submitStep = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { submission } = req.body;
    const userId = req.user?._id;

  
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized. User not found." });
    if (!mongoose.Types.ObjectId.isValid(sessionId)) return res.status(400).json({ success: false, message: "Invalid session id." });

    
    const session = await PracticeSession.findOne({ _id: sessionId, userId }).populate({
      path: 'problemId',
      select: 'title description topic difficulty constraints examples' 
    });

    if (!session) return res.status(404).json({ success: false, message: "Session not found." });

    const currentStep = session.currentStep;
    if (!submission && currentStep !== 'understanding') {
      return res.status(400).json({ success: false, message: "Submission is required for this step." });
    }

   
    let aiResponse;
    try {
      aiResponse = await aiMentor.getMentorResponse(session, submission || "");
    } catch (err) {
      console.error("AI call failed:", err);
      aiResponse = null;
    }

    const {
      feedback = "⚠️ The mentor is temporarily unavailable. Please try again.",
      shouldProgress = false,
      needsHelp = false,
      isStruggling = false,
      isComplete = false,
      targetStep
    } = aiResponse || {};

  
    session.performance.attempts = (session.performance.attempts || 0) + 1;
    if (needsHelp) session.performance.hintsUsed = (session.performance.hintsUsed || 0) + 1;

 
    if (isStruggling) {
      const struggleLevel = determineStruggleLevel(session, aiResponse);
      session.addStruggledStep(currentStep, struggleLevel, needsHelp ? 1 : 0);
    }

 
    const now = new Date();
    const timeSinceLastInteraction = now - session.lastInteractionAt;
    session.performance.thinkingTime += Math.floor(timeSinceLastInteraction / 1000);
    session.lastInteractionAt = now;

  
    session.history.push({
      step: currentStep,
      userSubmission: submission || "",
      feedbackGiven: feedback,
      timestamp: new Date()
    });

 
    let nextStep = currentStep;
    if (shouldProgress) {
      nextStep = targetStep || getNextStep(currentStep);
      session.currentStep = nextStep;

   
      if (nextStep !== currentStep) {
        session.addStruggledStep(currentStep, 'mild', 0);
      }

      if (nextStep === "completed" || isComplete) {
        session.status = "completed";
      }
    }

    await session.save();

    return res.status(200).json({
      success: true,
      data: {
        feedback,
        currentStep: session.currentStep,
        nextStep: nextStep !== currentStep ? nextStep : null,
        sessionId: session._id,
        performance: session.performance,
        shouldProgress,
        needsHelp
      },
    });

  } catch (error) {
    console.error("Error in submitStep:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


function determineStruggleLevel(session, aiResponse) {
  const attempts = session.performance.attempts || 0;
  if (attempts > 3) return 'severe';
  if (attempts > 1) return 'moderate';
  return 'mild';
}


const getNextStep = (step) => {
  const steps = ['understanding','edge_cases','brute_force','optimal','complexity','completed'];
  const currentIndex = steps.indexOf(step);
  return currentIndex >= 0 && currentIndex < steps.length - 1
    ? steps[currentIndex + 1]
    : 'completed';
};



const getSessionById = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user._id; 

 const session = await PracticeSession.findOne({ _id: sessionId, userId })
  .populate("problemId", "title difficulty topic") 
  .populate("userId", "name email")
  .select('+performance.thinkingTime +lastInteractionAt');

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found or you do not have permission." });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Error in getSessionById:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports={startSession,submitStep,getSessionById};