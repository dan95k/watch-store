var mongoose				= require('mongoose');
var passportLocalMongoose   = require("passport-local-mongoose");
var UserSchema				= new mongoose.Schema({
	username:{type:String, unique:true},
	email:{type:String, unique:true},
	password:String,
	mainAddress:String,
	secondAddress:String,
	city:String,
	country:String,
	zip:Number,
	isNewsletter:Boolean,
	orders:[],
	cart:[],
	wishlist:[],
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	isAdmin:Boolean
});
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User',UserSchema);
