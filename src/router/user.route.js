const express=require('express');

const router=express.Router();
const {signUp,loginUp,logOut,changePassword,  refreshAccessToken, generateAgoraToken}=require('../controllers/user.controller');
const {userAuth}=require('../middleware/auth');
const passport=require('../utils/passport-config')

router.route('/signup').post(signUp);
router.route('/login').post(loginUp);
router.route('/logout').get(userAuth,logOut);
router.route("/refresh-token").post(refreshAccessToken)
router.route('/change-password').post(userAuth,changePassword);
router.route('/agora/token').post(userAuth,generateAgoraToken);


router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email'] 
}));

router.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: 'http://localhost:5173/login', 
    session: true 
}), (req, res) => {

    console.log("Redirecting to dashboard...");
    res.redirect('http://localhost:5173/profile'); 
});

module.exports=router;

