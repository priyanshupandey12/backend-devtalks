const Project = require('../models/project.model');
const User=require('../models/user.model')
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


const updateProject=async(req,res)=>{
 try {
  const loggedInUser=req.user;

  const projectId=req.params.id;

  const project=await Project.findById(projectId);

  if(!project){
    return res.status(404).json({message:"Project not found"});
  }
  if(project.ownerId._id.toString()!==loggedInUser._id.toString()){
    return res.status(403).json({message:"You are not authorized to update this project"});
  }
   
  const {title,description,status}=req.body;
     
  if (!ALLOWED_STATUS.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

   const updatedProject=await Project.findByIdAndUpdate(projectId,{
    title,
    description,
    status
  },
  {
    new:true,
    runValidators: true
  });

  return res.status(200).json({
    message:"Project updated successfully", 
    data:updatedProject
  })
     } catch (error) {
      console.error('Error updating project:', error);
      return res.status(500).json({ message: 'An error occurred while updating the project' });
     }
}

const getallProjects=async(req,res)=>{
  try {
    // Find all projects where visibility is "public"
    const publicProjects = await Project.find({ visibility: "public" })
      .populate('ownerId', 'firstName lastName') // Populate owner details
      .populate('collaborators', 'firstName lastName'); // Populate collaborator details

    // If no public projects are found, return a 404 response
    if (publicProjects.length === 0) {
      return res.status(404).json({ message: "No public projects found" });
    }

    // Return the list of public projects
    return res.status(200).json({
      message: "Public projects retrieved successfully",
      data: publicProjects
    });
  } catch (error) {
    console.error('Error retrieving public projects:', error);
    return res.status(500).json({
      message: "An error occurred while retrieving public projects",
      error: error.message
    });
  }
}

const deleteProject = async (req, res) => {
   const loggedInUser = req.user;
   if (!loggedInUser) {
     return res.status(401).json({ message: "User is not authenticated" });
   }
     try {
      const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if(!project){
      return res.status(404).json({message:"Project not found"});
    }
    if(project.ownerId._id.toString()!==loggedInUser._id.toString()){
      return res.status(403).json({message:"You are not authorized to delete this project"});

    }
    await Project.findByIdAndDelete(projectId);
    return res.status(200).json({message:"Project deleted successfully"});
   } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({message:"An error occurred while deleting the project"});

   }

}
const getProjectCollaborators = async (req, res) => {
  try {

    const loggedInUser = req.user;
    if(!loggedInUser){
      return res.status(401).json({message:"User is not authenticated"});
    }
    const projectId = req.params.id;

    const project = await Project.findById(projectId).populate('collaborators.userId', 'firstName lastName ') .populate('ownerId', 'firstName lastName');
    if(!project){
      return res.status(404).json({message:"Project not found"});
    }
    return res.status(200).json({
      message: 'Collaborators retrieved successfully',
      owner: project.ownerId,
      collaborators: project.collaborators
    });
    
    
    
    }
   catch (error) {
    console.error('Error fetching collaborators:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching collaborators',
      error: error.message
    });
  }


}

const inviteCollaborators = async (req, res) => {
  try {
    // Check if user is authenticated
    const loggedInUser = req.user;
    if (!loggedInUser) {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    // Get project ID and role from request body
    const { projectId, role } = req.body;
    if (!projectId || !role) {
      return res.status(400).json({ message: "Project ID and role are required" });
    }

    // Get invited user ID from params
    const invitedUserId = req.params.id;
    
    // Find the invited user
    const invitedUser = await User.findById(invitedUserId);
    if (!invitedUser) {
      return res.status(404).json({ message: "Invited user not found" });
    }

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if logged in user is the project owner
    if (project.ownerId.toString() !== loggedInUser._id.toString()) {
      return res.status(403).json({ message: "Only project owner can invite collaborators" });
    }

    // Check if user is already a collaborator
    const isExistingCollaborator = project.collaborators.some(
      collaborator => collaborator.userId.toString() === invitedUserId
    );
    
    if (isExistingCollaborator) {
      return res.status(400).json({ message: "User is already a collaborator" });
    }

  

    // Add collaborator using the schema method
    await project.addCollaborator({userId:invitedUserId, role,inviteStatus: 'Pending'});
    await project.save();

    // You might want to send an email notification to the invited user here

    return res.status(200).json({
      message: "Collaborator added successfully",
      collaborator: {
        userId: invitedUser._id,
        inviteStatus: 'Pending',
        role: role

      }
    });

  } catch (error) {
    console.error('Error in inviteCollaborators:', error);
    return res.status(500).json({
      message: "An error occurred while inviting collaborator",
      error: error.message
    });
  }
};


const respondToInvite = async (req, res) => {
  try {
    // Check if the user is authenticated
    const loggedInUser = req.user;
    if (!loggedInUser) {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    // Get the project ID from the request params and the response from the body
    const { projectId } = req.params;
    const { response } = req.body; // 'Accepted' or 'Rejected'

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Find the collaborator in the project
    const collaborator = project.collaborators.find(
      (collaborator) => collaborator.userId.toString() === loggedInUser._id.toString()
    );

    if (!collaborator) {
      return res.status(404).json({ message: "Collaborator invite not found" });
    }

    // Check if the collaborator has already responded
    if (collaborator.inviteStatus !== 'Pending') {
      return res.status(400).json({
        message: `You have already ${collaborator.inviteStatus.toLowerCase()} this invitation`,
      });
    }

    // Update the inviteStatus based on the response
    if (response === 'Accepted') {
      collaborator.inviteStatus = 'Accepted';
    } else if (response === 'Rejected') {
      collaborator.inviteStatus = 'Rejected';
    } else {
      return res.status(400).json({ message: "Invalid response" });
    }

    // Save the updated project document
    await project.save();

    return res.status(200).json({
      message: `You have ${response.toLowerCase()} the invitation`,
      collaborator: {
        userId: collaborator.userId,
        role: collaborator.role,
        inviteStatus: collaborator.inviteStatus,
      },
    });
  } catch (error) {
    console.error('Error in respondToInvite:', error);
    return res.status(500).json({
      message: "An error occurred",
      error: error.message,
    });
  }
};





module.exports = { 
  createProject ,
  getProject,
  getPublicProject,
  updateProject,
  getallProjects,
  deleteProject,
  getProjectCollaborators,
  inviteCollaborators,
  respondToInvite
};