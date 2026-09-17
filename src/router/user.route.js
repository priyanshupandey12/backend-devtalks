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
  (req, res) => {
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? process.env.liveFrontendURL
      : (process.env.localFrontendURL || 'http://localhost:5173');

    try {
      const accessToken = req.user.generateAccessToken();
      const refreshToken = req.user.generateRefreshToken();

      req.user.refreshToken = refreshToken;
      req.user.save({ validateBeforeSave: false });

      const isProduction = process.env.NODE_ENV === 'production';
      const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
      };

      return res
        .cookie('accessToken', accessToken, { ...options, maxAge: 15 * 60 * 1000 })
        .cookie('refreshToken', refreshToken, { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 })
        .redirect(`${frontendUrl}/feed`);
    } catch (err) {
      console.error('Google Auth Error:', err);
      const frontendUrl = process.env.NODE_ENV === 'production'
        ? process.env.liveFrontendURL
        : (process.env.localFrontendURL || 'http://localhost:5173');
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
);
module.exports=router;

