const express=require('express');
const router=express.Router();

const {newchat}=require('../controllers/chat.controller')

const {userAuth}=require('../middleware/auth')

router.route('/:userId').get(userAuth,newchat)



module.exports=router