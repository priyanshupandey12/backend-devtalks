const express=require('express');
const {sendRequest,acceptRequest}=require('../controllers/connection.controller');
const {userAuth}=require('../middleware/auth');
const router=express.Router();
router.route('/request/send/:status/:toconnectionId').post(userAuth,sendRequest);
router.route('/request/review/:status/:requestId').post(userAuth,acceptRequest);
module.exports=router