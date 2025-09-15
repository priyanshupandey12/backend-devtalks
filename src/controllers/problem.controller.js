const Problem=require('../models/problem.model');
const mongoose = require('mongoose');
const {problemSchema}=require('../utils/validate');



const getAllProblems=async(req,res)=>{
     try {
        const {page,limit,sort,topic ,difficulty }=req.query;
        const pageNum=Math.max(parseInt(page) || 1 ,1);
        const limitNum=Math.min(parseInt(limit) || 10,50);
        const skip=(pageNum-1)*limitNum

        let filterOptions = {};
         if (topic) {
      filterOptions.topic = topic;
       }

           if (difficulty) {
      filterOptions.difficulty = difficulty;
       }

        let sortOptions={};
        if(sort) {
            const [field,value]=sort.split(':');
            sortOptions[field]=value=== 'asc'?1:-1;
        }
         
            const countProblem = await Problem.countDocuments(filterOptions);
            const totalPages = Math.ceil(countProblem / limitNum);
           const problems = await Problem.find(filterOptions)
             .sort(sortOptions)
             .skip(skip)
             .limit(limitNum)
             .select('title topic difficulty');
        

        if(!problems) {
            return res.status(400).json({message:"Problems are not found"})
        }

    
           return res.status(200).json({
             success: true,
             data: problems,
             pagination: {
              totalPages: totalPages,
              currentPage: pageNum,
              totalProblems: countProblem,
              hasNext: pageNum < totalPages,
      }
    });
  


     } catch (error) {
    console.error("Error in getAllProblems:", error);
    return res.status(500).json({ success: false, message: "Server error" });
     }
}

const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;

  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid problem ID format." });
    }

    const problem = await Problem.findById(id)
      .populate('similarProblemIds', 'title topic difficulty'); 
    
   
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found." });
    }

    return res.status(200).json({ success: true, data: problem });

  } catch (error) {
    console.error("Error in getProblemById:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const createProblem = async (req, res) => {
  try {
   
    const validatedData = problemSchema.parse({ body: req.body }).body;

 
    const existingProblem = await Problem.findOne({ title: validatedData.title });
    if (existingProblem) {
      return res.status(400).json({ error: "A problem with this title already exists." });
    }

   
    const problem = new Problem(validatedData);
    await problem.save();

    res.status(201).json({
      success: true,
      message: "Problem created successfully",
      problem,
    });
  } catch (error) {
    if (error.errors) {
   
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating problem:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getProblemForAIContext = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid problem ID" });
    }

    const problem = await Problem.findById(id)
      .select('title description topic difficulty constraints examples');
    
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    return res.status(200).json({ success: true, data: problem });

  } catch (error) {
    console.error("Error in getProblemForAIContext:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports={getAllProblems,getProblemById,createProblem,getProblemForAIContext}