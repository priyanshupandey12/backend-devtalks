const express=require('express');
const {showpendingConnection,acceptingConnection,choosingCardConnection,mutualConnection}=require('../controllers/showconnection.controller');
const {userAuth}=require('../middleware/auth');
const router=express.Router();
router.route('/viewrequest').get(userAuth,showpendingConnection);
router.route('/acceptconnection').get(userAuth,acceptingConnection);
router.route('/choosingcard').get(userAuth,choosingCardConnection);
router.route('/mutualconnection/:id').get(userAuth,mutualConnection);
module.exports=router