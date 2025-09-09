const express=require('express');
const router=express.Router();
const {startSession,submitStep,getSessionById}=require('../controllers/problemsession.controller')
const {userAuth,isAdmin}=require('../middleware/auth')


router.route('/session-start').post(userAuth,startSession);
router.route('/:id/submit').post(userAuth,submitStep);
router.route("session-id/:id").get(getSessionById);


module.exports=router;