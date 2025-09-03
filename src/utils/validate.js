const { z } = require("zod");


const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  emailId: z.string().email("EmailId is not valid"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
});


const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  description: z.string().optional(),
  photoUrl: z.string().url().optional(),
  skills: z.array(z.string()).optional(),
  location: z.union([
    z.string(), 
    z.object({
      type: z.enum(["Point"]),
      coordinates: z.array(z.number()).length(2),
      address: z.string().optional()
    })
  ]).optional(),
  commitment: z.object({
    hoursPerWeek: z.string().optional(),
    projectDuration: z.string().optional()
  }).optional(),
  primaryGoal: z.enum([
   'Build a Startup', 
   'Portfolio Project', 
   'Learn a New Skill', 
   'Hackathon', 
   'Just for Fun',
   'Learning', 
   'Building Projects',
    'Hackathon', 
    'Networking', 
    'Job Search'
  ]).optional(),
  userRole: z.enum(['Project Owner', 'Looking to Join','Developer','Designer']).optional(),
  links: z.object({
    githubUsername: z.string().optional(),
    linkedin: z.string().optional(),
    portfolio: z.string().optional()
  }).optional()
});


const validatesignUpData = (req) => {
  const result = signUpSchema.safeParse(req.body);
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
};

const validateProfileData = (req) => {
  const result = profileSchema.safeParse(req.body);
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
  return true;
};

module.exports = { validatesignUpData, validateProfileData };
