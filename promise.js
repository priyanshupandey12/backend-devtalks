

const cart=["shoes","madara","naruto"];

createOrder(cart).then(function(orderID){
  console.log(orderID);
  return orderID;
}).then(function(orderID){
   return proceedtopayment(orderID);
}).then(function(paymentStatus){
  console.log(paymentStatus);
  return paymentStatus;
}).then(function(paymentStatus){
    return showordersummary(paymentStatus);
}).then(function(summary){
  console.log(summary);
    return summary;
}).then(function(summary){
    return updatewallet(summary);
}).then(function(wallet){
  console.log(wallet);
})
.catch(function(err){
   console.log(err);
})


/*
output
shoes
payment successfull
order summary
wallet updated
*/




function createOrder(cart){
   return new Promise(function(resolve,reject){
    if(cart.length==0){
      reject("cart is empty");
     }
     else {
      let orderID=cart[0];
      resolve(orderID);
     }
   } )
}

function proceedtopayment(orderID){
  return new Promise(function(resolve,reject){
    if(orderID==="shoes"){
      resolve("payment successfull");
    }
    else{
      reject(orderID);
    }
    }
  )
}


function showordersummary(paymentStatus){
  return new Promise(function(resolve,reject){
    if(paymentStatus==="payment successfull"){
      resolve("order summary");
    }
    else{
      reject(paymentStatus);
    }
    
  }
  )
}

function updatewallet(summary){ 
  return new Promise(function(resolve,reject){
    if(summary==="order summary"){
      resolve("wallet updated");
    }
    else{
      reject(summary);
    }
    
  }
  )

}