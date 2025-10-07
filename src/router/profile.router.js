const express=require('express');
const {viewProfile,editProfile}=require('../controllers/profile.controller');
const {userAuth}=require('../middleware/auth');
const router=express.Router();
const upload=require('../middleware/multer')
router.route('/viewprofile').get(userAuth,viewProfile);
router.route('/editprofile').patch(userAuth,upload.single('Profile'),editProfile);
 
module.exports=router