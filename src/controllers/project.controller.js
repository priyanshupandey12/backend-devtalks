const Project = require('../models/project.model');

const ALLOWED_STATUS = ['In Progress', 'Completed', 'On Hold'];
const ALLOWED_VISIBILITY = ['public', 'private', 'shared'];

const createProject = async (req, res) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser) {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    const { title, description, status, visibility } = req.body;

    if (!title || !description || !visibility || !status) {
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
      ownerId: loggedInUser._id
    });

    await newProject.populate('ownerId', 'firstName lastName');

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

module.exports = { createProject };