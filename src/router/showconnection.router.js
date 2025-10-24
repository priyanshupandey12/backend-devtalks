const express=require('express');
const {showpendingConnection,acceptingConnection,choosingCardConnection}=require('../controllers/showconnection.controller');
const {userAuth}=require('../middleware/auth');
const router=express.Router();
router.route('/viewrequest').get(userAuth,showpendingConnection);
router.route('/acceptconnection').get(userAuth,acceptingConnection);
router.route('/choosingcard').get(userAuth,choosingCardConnection);

module.exports=router