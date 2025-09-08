const express=require('express');
const router=express.Router();
const {getAllProblems}=require('../controllers/problem.controller')
const {userAuth}=require('../middleware/auth')

router.route('/all-problems').get(userAuth,getAllProblems);


module.exports=router;