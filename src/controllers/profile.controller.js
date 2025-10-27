const { validateProfileData } = require('../utils/validate');
const geocodeAddress=require('../utils/geocode');
const {uploadOnCloudinary,deleteFromCloudinary}=require('../utils/cloudinary')
const logger=require('../utils/logger')

function getPublicIdFromUrl(url) {
  const parts = url.split('/');
  const uploadIndex = parts.findIndex(p => p === 'upload');
  const publicIdWithExt = parts.slice(uploadIndex + 2).join('/'); 
  return publicIdWithExt.split('.')[0]; 
}

const viewProfile=async(req,res)=>{
try {
    const user = req.user; 

 
    logger.debug(`User profile viewed : ${user.emailId} (ID: ${user._id})`);


    const userProfile = user.toObject(); 
    

    delete userProfile.password;
    delete userProfile.refreshToken;
    delete userProfile.loginAttempts;
    delete userProfile.lockUntil;
    delete userProfile.__v; 

    return res.status(200).json({ success: true, user: userProfile }); 

  } catch (error) {
 
    const userId = req.user ? req.user._id : 'UNKNOWN';
    logger.error(`Error in viewProfile for user ID ${userId}: ${error.message}`, {
      stack: error.stack
    });

  
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred."
    });
  }
}

const editProfile = async (req, res) => {
  const loggedInUser = req.user;
  logger.debug(`Edit profile attempt by user: ${loggedInUser.emailId} (ID: ${loggedInUser._id})`);
  try {
  
    if (req.body.links && typeof req.body.links === 'string') {
      req.body.links = JSON.parse(req.body.links);
    }
     const validationResult = validateProfileData(req.body);

if (!validationResult.success) {
   
      const firstError = Object.values(validationResult.errors)[0]?.[0];
      logger.warn(`Edit profile validation failed for user ${loggedInUser._id}: ${firstError}`, { allErrors: validationResult.errors });
      
      return res.status(400).json({
        success: false,
        message: firstError || "Invalid data provided.",
        details: validationResult.errors,
      });
    }
    const imageLocalFilePath=req.file?.path;


    const isImageExist=loggedInUser.photoUrl;
      if(isImageExist!=="") {
          await deleteFromCloudinary(getPublicIdFromUrl(isImageExist))
      }

      let updatedImage=isImageExist
      if(imageLocalFilePath) {
      const response= await uploadOnCloudinary(imageLocalFilePath);
       updatedImage=response.url;
         loggedInUser.photoUrl = updatedImage;
      }

   
if (req.body.location && typeof req.body.location === 'string' && req.body.location.trim() !== '') {
    

    const coordinates = await geocodeAddress(req.body.location);


    if (coordinates && coordinates.length === 2) {

        const [lng, lat] = coordinates;
        loggedInUser.location = {
            type: 'Point',
            coordinates: [lng, lat],
            address: req.body.location,
        };
       
        delete req.body.location;
    } else {
     
        logger.error(`Geocoding API error for user ${loggedInUser._id}: ${geocodeError.message}`);
     
    }

}

    const enumFields = ['primaryGoal', 'userRole','location'];
enumFields.forEach(field => {
  if (req.body[field] === "") req.body[field] = undefined;
});

    Object.keys(req.body).forEach(key => {
      loggedInUser[key] = req.body[key];
    });

    await loggedInUser.save();
    logger.info(`Profile updated successfully for user ${loggedInUser.emailId} (ID: ${loggedInUser._id})`);

     const userToReturn = loggedInUser.toObject();
    delete userToReturn.password;
    delete userToReturn.refreshToken;
    delete userToReturn.loginAttempts;
    delete userToReturn.lockUntil;

    return res.status(200).json({
        user: userToReturn,
    });
  } catch (error) {
   logger.error(`Unhandled error in editProfile for user ${loggedInUser._id}: ${error.message}`, { stack: error.stack });
    return res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
};


    
    

module.exports={viewProfile,editProfile}