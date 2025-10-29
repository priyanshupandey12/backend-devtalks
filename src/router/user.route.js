const express=require('express');

const router=express.Router();
const {signUp,loginUp,logOut,changePassword,  refreshAccessToken, generateAgoraToken}=require('../controllers/user.controller');
const {userAuth}=require('../middleware/auth');
const passport=require('../utils/passport-config')
const {loginLimiter,SignLimiter}=require('../middleware/ratelimiter')

router.route('/signup').post(SignLimiter,signUp);
router.route('/login').post(loginLimiter,loginUp);
router.route('/logout').get(userAuth,logOut);
router.route("/refresh-token").post(refreshAccessToken)
router.route('/change-password').post(userAuth,changePassword);
router.route('/agora/token').post(userAuth,generateAgoraToken);


router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.liveFrontendURL}/login`, 
    session: false 
  }),
  async (req, res) => {
    try {
      const accessToken = req.user.generateAccessToken();
      const refreshToken = req.user.generateRefreshToken();

      req.user.refreshToken = refreshToken;
      await req.user.save({ validateBeforeSave: false });

    
      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      };

      return res
        .cookie('accessToken', accessToken, { ...options, maxAge: 15 * 60 * 1000 }) 
        .cookie('refreshToken', refreshToken, { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 }) 
        .redirect(`${process.env.liveFrontendURL}/feed`);
    } catch (err) {
      console.error('Google Auth Error:', err);
      res.redirect(`${process.env.liveFrontendURL}/login?error=oauth_failed`);
    }
  }
);
module.exports=router;

