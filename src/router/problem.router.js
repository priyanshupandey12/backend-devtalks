const express=require('express');
const router=express.Router();
const {getAllProblems,getProblemById,createProblem,getProblemForAIContext}=require('../controllers/problem.controller')
const {userAuth,isAdmin}=require('../middleware/auth')


router.route('/all-problems').get(userAuth,getAllProblems);
router.route('/:id').get(userAuth,getProblemById);
router.route('/create-problem').post(userAuth,createProblem);
router.get('/ai-context/:id', getProblemForAIContext);
module.exports=router;