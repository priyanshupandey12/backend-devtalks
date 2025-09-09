const PracticeSession = require('../models/problemsession.model');


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

   
    const existingSession = await PracticeSession.findOne({
      userId,
      problemId,
      status: "in_progress",
    });

    if (existingSession) {
      return res.status(200).json({
        success: true,
        data: existingSession,
        message: "Resuming existing session.",
      });
    }


    const newSession = new PracticeSession({
      userId,
      problemId,
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

    if (!submission) {
      return res.status(400).json({ success: false, message: "Submission is required." });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. User not found." });
    }

 
    const session = await PracticeSession.findOne({ _id: sessionId, userId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found or you do not have permission.",
      });
    }

    const currentStep = session.currentStep;
    const nextStep = getNextStep(currentStep);

    // --- AI Logic will go here in the future ---
    const feedback =
      nextStep === "completed"
        ? "Well done! You’ve finished the session. 🎉"
        : "Great! Let's move to the next step.";
    // --- End of placeholder logic ---

  
    session.history.push({
      step: currentStep,
      userSubmission: submission,
      feedbackGiven: feedback,
    });

 
    if (nextStep === "completed") {
      session.status = "completed";
    } else {
      session.currentStep = nextStep;
    }

    await session.save();

    return res.status(200).json({
      success: true,
      data: {
        feedback,
        nextStep,
        sessionId: session._id,
      },
    });
  } catch (error) {
    console.error("Error in submitStep:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


const getNextStep = (step) => {
  const steps = [
    "understanding",
    "edge_cases",
    "pseudocode",
    "complexity",
    "solution_review",
  ];
  const currentIndex = steps.indexOf(step);
  return currentIndex >= 0 && currentIndex < steps.length - 1
    ? steps[currentIndex + 1]
    : "completed";
};


const getSessionById = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user._id; // from auth middleware

    const session = await PracticeSession.findOne({ _id: sessionId, userId })
      .populate("problemId", "title difficulty") 
      .populate("userId", "name email"); 

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