

const mongoose = require('mongoose');



const connectDB=async()=>{
  await mongoose.connect('mongodb+srv://priyanshupandat32:KNUHurAAZgsQ8g7k@cluster0.a8ecs.mongodb.net/DevTinder')

}
module.exports=connectDB;