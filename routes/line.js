var express = require("express");
var router  = express.Router();
var Line = require("../models/line");

//=========== Lines Page ================
router.get('/:lineId',function(req,res){
	Line.findById(req.params.lineId, function(err,foundLine){
		if (err){
			console.log(err);
			req.flash('error',"Couldn't find line")
			res.redirect('/');
		} else {
			res.render('linePage', {line:foundLine});
		}
	})
});

module.exports = router;