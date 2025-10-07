const { validateProfileData } = require('../utils/validate');
const geocodeAddress=require('../utils/geocode');
const {uploadOnCloudinary,deleteFromCloudinary}=require('../utils/cloudinary')


function getPublicIdFromUrl(url) {
  const parts = url.split('/');
  const uploadIndex = parts.findIndex(p => p === 'upload');
  const publicIdWithExt = parts.slice(uploadIndex + 2).join('/'); 
  return publicIdWithExt.split('.')[0]; 
}

const viewProfile=async(req,res)=>{
  const user=req.user;
  const token=req.accessToken
  return res.status(200).json({user,token});  
}

const editProfile = async (req, res) => {
  try {
     if (req.body.commitment && typeof req.body.commitment === 'string') {
      req.body.commitment = JSON.parse(req.body.commitment);
    }
    if (req.body.links && typeof req.body.links === 'string') {
      req.body.links = JSON.parse(req.body.links);
    }
    const isDataValid = validateProfileData(req);
    const imageLocalFilePath=req.file?.path;


    if (!isDataValid) {
      throw new Error('Invalid Edit Data Request');
    }

    const loggedInUser = req.user;

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
     const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

   
    if (!token) {
        return res.status(401).json({ error: "Authentication token could not be found." });
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
     
        console.warn(`Could not find coordinates for address: "${req.body.location}". User location was not updated.`);
     
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

     const userToReturn = loggedInUser.toObject();
    delete userToReturn.password;
    delete userToReturn.refreshToken;

    return res.status(200).json({
        user: userToReturn,
      accessToken: token
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};


    
    

module.exports={viewProfile,editProfile}