const Problem=require('../models/problem.model');


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



module.exports={getAllProblems}