const { validateProfileData } = require('../utils/validate');


const viewProfile=async(req,res)=>{
  const user=req.user;
  return res.status(200).json(user); 
}

const editProfile = async (req, res) => {
  try {
    const isDataValid = validateProfileData(req);
    if (!isDataValid) {
      throw new Error('Invalid Edit Data Request');
    }

    const loggedInUser = req.user;

    Object.keys(req.body).forEach(key => {
      loggedInUser[key] = req.body[key];
    });

    await loggedInUser.save();

    return res.status(200).json({
      message: `${loggedInUser.firstName} ${loggedInUser.lastName} updated successfully`,
      data: loggedInUser,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};


    
    

module.exports={viewProfile,editProfile}