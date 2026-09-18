const { z } = require("zod");


const signUpSchema = z.object({
  firstName: z.string().min(3, "First name must be at least 3 characters"), 
  lastName: z.string().min(1, "Last name cannot be empty."),
  emailId: z.string().email("Hmm, that doesn’t look like a valid email."),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  educationYear: z.enum(
    ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'], 
    { errorMap: () => ({ message: "Please select your current education year." }) }
  ),
  gender: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const lower = val.trim().toLowerCase();
        if (lower === 'male') return 'Male';
        if (lower === 'female') return 'Female';
        if (lower === 'other' || lower === 'others') return 'Other';
      }
      return val;
    },
    z.enum(['Male', 'Female', 'Other'], { errorMap: () => ({ message: "Please select a gender" }) })
  ),
  yearsOfExperience: z.coerce
    .number({ invalid_type_error: "Please enter your years of experience as a number." })
    .min(0, "Years of experience cannot be negative")
    .optional(),
});


const loginSchema = z.object({
  emailId: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});


const githubUsernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/[a-zA-Z0-9_.-]+\/?$/i;
const urlRegex = /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/;

const editProfileSchema = z.object({
  firstName: z.string().min(3, "First name must be at least 3 characters").optional(),
  lastName: z.string().optional(),
  gender: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const lower = val.trim().toLowerCase();
        if (lower === 'male') return 'Male';
        if (lower === 'female') return 'Female';
        if (lower === 'other' || lower === 'others') return 'Other';
        if (lower === '') return '';
      }
      return val;
    },
    z.enum(["Male", "Female", "Other", ""], { errorMap: () => ({ message: "Please select a valid gender" }) }).optional()
  ),
  description: z.string().optional(),
  experienceLevel: z.enum(['Student', 'Beginner', 'Intermediate', 'Senior', '']).optional(),
  educationYear: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', '']).optional(),
  collegeName: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  skills: z.array(z.string()).optional(),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience cannot be negative").optional(),
  location: z.string().trim().min(1, "Location is required.").optional(), 
  timezone: z.string().optional(),
  primaryGoal: z.enum([
     'Find Teammates for a Project', 
      'Find a Job or Internship',     
      'Find a Mentor or Partner to Learn', 
      'Network and Explore',
      ''
  ]).optional(),
  userRole: z.enum([
    'Designer', 'Student', 'Frontend Developer', 'Backend Developer', 
    'Fullstack Developer', 'Data Scientist', 'Data Analyst', 
    'DevOps Engineer', 'Other', ''
  ]).optional(),
  links: z.object({
    githubUsername: z.string()
      .trim()
      .transform(val => {
        let cleaned = val.replace(/^@/, '');
        if (cleaned.includes('github.com/')) {
          cleaned = cleaned.split('github.com/').pop().replace(/\/$/, '');
        }
        return cleaned;
      })
      .pipe(
        z.string()
          .min(1, "GitHub Username is required.")
          .regex(githubUsernameRegex, "Please enter a valid GitHub username (e.g. octocat).")
      ),
    linkedin: z.string()
      .trim()
      .transform(val => {
        if (val && !/^https?:\/\//i.test(val)) {
          return `https://${val}`;
        }
        return val;
      })
      .pipe(
        z.string()
          .min(1, "LinkedIn Profile URL is required.")
          .regex(linkedinRegex, "Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/username).")
      ),
    portfolio: z.string()
      .optional()
      .transform(val => {
        if (!val || !val.trim()) return '';
        let url = val.trim();
        if (!/^https?:\/\//i.test(url)) return `https://${url}`;
        return url;
      })
      .refine(val => {
        if (!val) return true;
        return urlRegex.test(val);
      }, "Please enter a valid Portfolio URL (e.g. https://yourportfolio.dev)."),
  }).optional(),
});




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