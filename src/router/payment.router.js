const express=require('express');
const router=express.Router();
const {userAuth}=require('../middleware/auth');

const {createPayment}=require('../controllers/payment.controller')

router.route('/create').post(userAuth,createPayment)

module.exports=router