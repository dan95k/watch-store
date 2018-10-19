var mongoose				= require('mongoose');
var LineSchema				= new mongoose.Schema({
	name:String,
	image:String,
	description:String,
	products:[]
});
module.exports = mongoose.model('Line',LineSchema);
