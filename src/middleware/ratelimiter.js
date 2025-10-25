const rateLimit = require('express-rate-limit');

const SignLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 5, 
  message: {
    status: 429,
    message: "Too many signup attempts. Please try again later."
  },
  standardHeaders: true, 
  legacyHeaders: false,
});


const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 3, 
  message: {
    status: 429,
    message: "Too many login attempts. Please try again later."
  },
  standardHeaders: true, 
  legacyHeaders: false,
});

module.exports={loginLimiter,SignLimiter}