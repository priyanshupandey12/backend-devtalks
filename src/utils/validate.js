const { z } = require("zod");


const signUpSchema = z.object({
  firstName: z.string().min(3, "First name must be at least 3 characters"), 
  lastName: z.string().min(1, "Last name is required"),
  emailId: z.string().email("EmailId is not valid"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  educationYear: z.enum(
    ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'], 
    { errorMap: () => ({ message: "Please select a valid education year" }) }
  ),
  gender: z.enum(['Male', 'Female', 'Other'], 
    { errorMap: () => ({ message: "Please select a gender" }) }
  )
});


const loginSchema=z.object({
   emailId: z.string().email("EmailId is not valid"),
     password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
})


const editProfileSchema = z.object({
  firstName: z.string().min(3, "First name must be at least 3 characters").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  description: z.string().optional(),
  experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  educationYear: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']).optional(),
  collegeName: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  skills: z.array(z.string()).optional(),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience cannot be negative").optional(),
  location: z.string().optional(), 
  timezone: z.string().optional(),
  primaryGoal: z.enum([
    'Build a Startup', 'Portfolio Project', 'Learn a New Skill', 
    'Hackathon', 'Just for Fun', 'Learning', 'Building Projects', 
    'Networking', 'Job Search', 'Project Partner', 'Learning Partner',
    'Mentor', 'Mentee', 'Internship', 'Job', 'Freelance Collaboration'
  ]).optional(),
  userRole: z.enum([
    'Designer', 'Student', 'Frontend Developer', 'Backend Developer', 
    'Fullstack Developer', 'Data Scientist', 'Data Analyst', 
    'DevOps Engineer', 'Other'
  ]).optional(),
  links: z.object({
    githubUsername: z.string().optional(),
    linkedin: z.string().url("Must be a valid URL").or(z.literal('')).optional(),
    portfolio: z.string().url("Must be a valid URL").or(z.literal('')).optional(),
  }).optional(),
})
.refine(data => {
  if (data.educationYear === 'Graduate') {
    return typeof data.yearsOfExperience === 'number' && data.yearsOfExperience >= 0;
  }
  return true;
}, { message: "Years of experience is required for graduates.", path: ["yearsOfExperience"] })
.refine(data => {
  if (data.educationYear && data.educationYear !== 'Graduate') {
    return data.yearsOfExperience === undefined || data.yearsOfExperience === 0;
  }
  return true;
}, { message: "Cannot specify years of experience if not a graduate.", path: ["yearsOfExperience"] });




const validatesignUpData = (data) => {
  const result = signUpSchema.safeParse(data);
  if (result.success) {
    return {
      success: true,
      data: result.data, 
    };
  } else {
    return {
      success: false,
     
      errors: result.error.flatten().fieldErrors, 
    };
  }
};

const validateloginData=(data)=>{
    const result=loginSchema.safeParse(data);
      if (result.success) {
    return {
      success: true,
      data: result.data, 
    };
  } else {
    return {
      success: false,
     
      errors: result.error.flatten().fieldErrors, 
    };
  }
}

const validateProfileData = (data) => {
  const result = editProfileSchema.safeParse(data);
  if (result.success) {
    return {
      success: true,
      data: result.data, 
    };
  } else {
 
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }
};

module.exports = { validatesignUpData, validateProfileData, editProfileSchema, signUpSchema ,validateloginData}; 