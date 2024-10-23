const express=require('express');
const {createProject,getProject,getPublicProject,
  updateProject,getallProjects,deleteProject,
  getProjectCollaborators,inviteCollaborators,respondToInvite}=require('../controllers/project.controller')
const {userAuth}=require('../middleware/auth');
const router=express.Router();

router.route('/create').post(userAuth,createProject);
router.route('/all').get(getallProjects);
router.route('/:id').get(userAuth,getProject);
router.route('/public/:id').get(getPublicProject);
router.route('/update/:id').patch(userAuth,updateProject);
router.route('/delete/:id').delete(userAuth,deleteProject);
router.route('/collaborators/:id').get(userAuth,getProjectCollaborators);
router.post('/invite/:id', userAuth, inviteCollaborators);
router.post('/:projectId/respond-invite', userAuth, respondToInvite);

module.exports=router