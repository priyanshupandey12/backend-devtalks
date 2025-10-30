const cloudinary=require('cloudinary').v2
const fs=require('fs')
const logger=require('../utils/logger')

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (file) => { 
  try {
    if (!file) {
      logger.debug("Cloudinary upload skipped: file object is null or undefined.");
      return null;
    }

 
    const b64 = file.buffer.toString('base64');
    let dataURI = `data:${file.mimetype};base64,${b64}`;

    const response = await cloudinary.uploader.upload(dataURI, {
      resource_type: "image" 
    });

    logger.debug(`File uploaded to Cloudinary successfully. URL: ${response.secure_url}`);
   
    return response;

  } catch (error) {
    logger.error(`Failed to upload file to Cloudinary.`, error);

    return null;
  }
}


const deleteFromCloudinary=async(publicID)=>{
    try {
       if (!publicID) {
      logger.debug("Cloudinary delete skipped: publicID is null or undefined.");
      return null;
    }
        const response=await cloudinary.uploader.destroy(publicID,{
            resource_type:"image"
        })
        
    if (response.result === "ok") {
     logger.debug(`File deleted from Cloudinary. Public ID: ${publicID}`);
    } else {
      logger.warn(`File not found on Cloudinary or already deleted. Public ID: ${publicID}`);
    }

    return response;
    } catch (error) {
    logger.error(`Error deleting file from Cloudinary. Public ID: ${publicID}`, error);
    return null;
    }
}

module.exports={uploadOnCloudinary,deleteFromCloudinary}