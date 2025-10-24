const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User=require('../models/user.model');
const logger = require('../utils/logger');


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_KEY,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET_KEY,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async(accessToken, refreshToken, profile, done) => {
           try {
            logger.debug(`Google OAuth: Processing user profile. ID: ${profile.id}, Email: ${userEmail}`);
                let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { emailId: profile.emails?.[0]?.value },
          ],
        });
        if (user) {
         
          if (!user.googleId) user.googleId = profile.id;

         
          user.firstName = user.firstName || profile.name?.givenName;
          user.lastName = user.lastName || profile.name?.familyName;
          user.photoUrl = user.photoUrl || profile.photos?.[0]?.value;
          user.authProvider = 'google';
          user.lastLogin = new Date();

          await user.save();
          logger.info(`Google OAuth: Existing user logged in: ${user.emailId} (ID: ${user._id})`);
        } else {
        
          user = new User({
            googleId: profile.id,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            emailId: profile.emails?.[0]?.value,
            password: '', 
            photoUrl: profile.photos?.[0]?.value,
            authProvider: 'google',
            lastLogin: new Date(),
          });

          await user.save();
          console.log(`Google OAuth: New user created: ${user.emailId}`);
        }

        done(null, user);
           } catch (error) {
               logger.error(`Google OAuth Strategy error for profile ID ${profile.id}: ${error.message}`, {
        profileId: profile.id,
        stack: error.stack
      });

      done(error, null);
    
        
           }
}));




module.exports = passport;
