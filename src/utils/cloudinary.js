const cloudinary=require('cloudinary').v2
const fs=require('fs')

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
    
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "image"
        })
     
   
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) 
        return null;
    }
}


const deleteFromCloudinary=async(publicID)=>{
    try {
        if(!publicID) return null;
        const response=await cloudinary.uploader.destroy(publicID,{
            resource_type:"image"
        })
        
    if (response.result === "ok") {
      console.log("file is deleted from cloudinary ", response);
    } else {
      console.log(" File not found or already deleted:");
    }

    return response;
    } catch (error) {
  console.error(" Error deleting file from Cloudinary:", error);
    return null;
    }
}

module.exports={uploadOnCloudinary,deleteFromCloudinary}