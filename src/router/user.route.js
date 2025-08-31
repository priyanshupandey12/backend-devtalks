const express=require('express');

const router=express.Router();
const {signUp,loginUp,logOut,changePassword,generateAgoraToken}=require('../controllers/user.controller');
const {userAuth}=require('../middleware/auth');

router.route('/signup').post(signUp);
router.route('/login').post(loginUp);
router.route('/logout').get(logOut);
router.route('/change-password').post(userAuth,changePassword);
router.route('/agora/token').post(userAuth,generateAgoraToken);

module.exports=router;

