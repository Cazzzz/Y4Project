const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
 name: {
     type: String,
     required: true,
     min: 6,
     max: 255
 },
 user_id:{
     type: String,
     required:true,
     ref: 'User',
     min: 6,
     max: 255
 },
 components: {
     type: String,
     required: true,
     max: 1024,
     min: 6
 },
 date:{
   type: Date,
   default: Date.now 
 }


});


module.exports =  mongoose.model('User', userSchema);