const Project = require('../models/project.model');

const ALLOWED_STATUS = ['In Progress', 'Completed', 'On Hold'];
const ALLOWED_VISIBILITY = ['public', 'private', 'shared'];

const createProject = async (req, res) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser) {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    const { title, description, status, visibility, collaborators = [] , category} = req.body;

    if (!title || !description || !visibility || !status || category.length === 0) {
      return res.status(400).json({ message: "Fill all required fields" });
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (!ALLOWED_VISIBILITY.includes(visibility)) {
      return res.status(400).json({ message: 'Invalid visibility' });
    }

    const newProject = await Project.create({
      title,
      description,
      visibility,
      status,
      category,
      ownerId: loggedInUser._id
    });

    // Associate collaborators with the project
    if (collaborators.length > 0) {
      await Promise.all(collaborators.map(async (collaborator) => {
        const { id, role } = collaborator;
        await newProject.addCollaborator(id, role);
      }));
    }
  
    await newProject.save();

    await newProject.populate('ownerId', 'firstName lastName');
    await newProject.populate('collaborators', 'firstName lastName');

    return res.status(201).json({
      message: "Project created successfully",
      data: newProject
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      message: "An error occurred while creating the project",
      error: error.message
    });
  }
};

const getProject=async(req,res)=>{
 try {
  const loggedInUser=req.user;

  if (!loggedInUser) {
    return res.status(401).json({ message: "User is not authenticated" });
  }

  const projectId=req.params.id;

  if (!projectId) {
    return res.status(400).json({ message: "Project ID is required" });
  }
  
  const findProject = await Project.findById(projectId)
  .populate('ownerId', 'firstName lastName').populate('collaborators', 'firstName lastName');

  if (!findProject) {
    return res.status(404).json({ message: "Project not found" });
  }
   
  let hasAccess=false;

   if(findProject.visibility==="private") {
    hasAccess= loggedInUser && findProject.ownerId._id.toString() === loggedInUser._id.toString();
  
    
   } 
   else if(findProject.visibility==="shared") {
      hasAccess=loggedInUser &&(
        findProject.ownerId._id.toString() === loggedInUser._id.toString() ||
        findProject.Collaborators.some(collaborator => collaborator._id.toString() === loggedInUser._id.toString())
      )

   }

 
  return res.status(200).json({
    message: "Project retrieved successfully",
    data: findProject
  });

 } 
 
 catch (error) {
  console.error('Error finding project:', error);
  return res.status(500).json({
    message: "An error occurred while finding the project",
    error: error.message
  });
 }


}


const getPublicProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    const findProject = await Project.findOne({
      _id: projectId,
      visibility: "public"
    })
    .populate('ownerId', 'firstName lastName')
    .populate('collaborators', 'firstName lastName');

    if (!findProject) {
      return res.status(404).json({ message: "Public project not found" });
    }

    return res.status(200).json({
      message: "Public project retrieved successfully",
      data: findProject
    });
  } catch (error) {
    console.error('Error finding public project:', error);
    return res.status(500).json({
      message: "An error occurred while finding the public project",
      error: error.message
    });
  }
};



module.exports = { createProject ,getProject,getPublicProject};