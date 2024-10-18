const express=require('express');
const {createProject}=require('../controllers/project.controller')
const {userAuth}=require('../middleware/auth');
const router=express.Router();

router.route('/create').post(userAuth,createProject);

module.exports=router