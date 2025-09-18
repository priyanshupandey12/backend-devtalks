const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User=require('../models/user.model');



passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_KEY,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET_KEY,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async(accessToken, refreshToken, profile, done) => {
           try {
              console.log('Google OAuth: Processing user:', profile.emails?.[0]?.value);
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
          console.log(`Google OAuth: Existing user logged in: ${user.emailId}`);
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
               console.error('Google OAuth Strategy error:', error);
    
        done(error, null);
           }
}));




module.exports = passport;
