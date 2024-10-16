const express=require('express');

const router=express.Router();
const {signUp,loginUp,logOut}=require('../controllers/user.controller');

router.route('/signup').post(signUp);
router.route('/login').post(loginUp);
router.route('/logout').get(logOut);

module.exports=router;

