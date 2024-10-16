const express=require('express');
const {viewProfile,editProfile}=require('../controllers/profile.controller');
const {userAuth}=require('../middleware/auth');
const router=express.Router();
router.route('/viewprofile').get(userAuth,viewProfile);
router.route('/editprofile').patch(userAuth,editProfile);

module.exports=router