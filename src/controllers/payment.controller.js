const Payment=require('../models/payment.model')
const { membershipAmount } = require('../utils/constant')
const instance=require('../utils/razorpay')

const createPayment=async(req,res)=>{

  try {
    const {membershipType}=req.body
    const {firstName,lastName,emailId}=req.user

   const order=await instance.orders.create({
      amount:membershipAmount[membershipType]*100,
      currency:"INR",
      receipt:"reciept#1",
      notes:{
        firstName:firstName,
        lastName:lastName,
        emailId:emailId,
        membershipType:membershipType
      }
    })

    const payment=await Payment.create({
      userId:req.user._id,
      amount:order.amount,
      currency:order.currency,
      receipt:order.receipt,
      orderId:order.id,
      notes:order.notes,
      status:order.status,
     

    })

 

    res.status(200).json({
       success:true,
       data:{...payment.toJSON()},
       keyid:instance.key_id,
       message:"payment created successfully"
      
    });
    
  } catch (error) {
    console.log(error)
  }
}

module.exports={createPayment}