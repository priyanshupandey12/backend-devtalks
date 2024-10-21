const express=require('express');
const {createProject,getProject,getPublicProject}=require('../controllers/project.controller')
const {userAuth}=require('../middleware/auth');
const router=express.Router();

router.route('/create').post(userAuth,createProject);
router.route('/:id').get(userAuth,getProject);
router.route('/public/:id').get(getPublicProject);

module.exports=router