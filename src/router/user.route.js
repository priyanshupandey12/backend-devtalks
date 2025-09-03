const express=require('express');

const router=express.Router();
const {signUp,loginUp,logOut,changePassword,  refreshAccessToken, generateAgoraToken}=require('../controllers/user.controller');
const {userAuth}=require('../middleware/auth');

router.route('/signup').post(signUp);
router.route('/login').post(loginUp);
router.route('/logout').get(userAuth,logOut);
router.route("/refresh-token").post(refreshAccessToken)
router.route('/change-password').post(userAuth,changePassword);
router.route('/agora/token').post(userAuth,generateAgoraToken);

module.exports=router;

