const validator=require('validator')
const validatesignUpData=(req)=>{
  const{firstName,lastName,emailId,password}=req.body;
  if(!firstName || !lastName){
    throw new Error('Name is not valid');
  }
  else if(!validator.isEmail(emailId)){
    throw new Error('EmailId is not valid');
  }
  else if(!validator.isStrongPassword(password)){
    throw new Error('password is not strong');
  }
}

const validateProfileData = (req) => {
  const allowedFields = ['firstName', 'lastName', 'gender', 'emailId', 'description', 'photoUrl', 'skills'];
  return Object.keys(req.body).every(field => allowedFields.includes(field));
};

module.exports={validatesignUpData
,validateProfileData};