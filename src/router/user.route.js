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


router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);


router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false, 
  }),
  async (req, res) => {
    try {
   
      const accessToken = req.user.generateAccessToken();
      const refreshToken = req.user.generateRefreshToken();

      
      req.user.refreshToken = refreshToken;
      await req.user.save({ validateBeforeSave: false });

   
      const redirectURL = `${process.env.FRONTEND_URL}/profile?accessToken=${accessToken}&refreshToken=${refreshToken}`;
      res.redirect(redirectURL);
    } catch (err) {
      console.error('Google Auth Error:', err);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

module.exports=router;

