var express = require("express");
var router  = express.Router();
var Line = require("../models/line");
var User = require("../models/user");
var middleware = require("../middleware");

//============ Deleting =================
router.get('/line',middleware.isAdmin,function(req,res){
	Line.find({},function(err,allLines){
		if (err){
			console.log(err);
			req.flash('error',err.message);
			res.redirect('/')
		} else {
			res.render('delete/deleteLine',{lines:allLines});
		}
	})
});
router.post('/line',middleware.isAdmin,function(req,res){
	Line.findByIdAndRemove(req.body.selectedLine, function(err){
		if (err){
			console.log(err);
			req.flash('error',err.message);
			res.redirect('/');
		} else {
			req.flash('success','Line and all its products has been removed!');
			res.redirect('/');
		}
	})
});

router.get('/product',middleware.isAdmin,function(req,res){
	Line.find({},function(err,allLines){
		if (err){
			console.log(err);
			req.flash('error',err.message);
			res.redirect('/')
		} else {
			res.render('delete/deleteProduct', {lines:allLines})
		}
	})
});
router.post('/product',middleware.isAdmin,function(req,res){
	if(!req.body.selected){	//if no product selected
		req.flash('error','Nothing selected');
		return res.redirect('/delete/product');
	} else {
		var ObjectId = require('mongodb').ObjectID;
		for(i=0;i<req.body.selected.length;i++){
			var selectedItem = JSON.parse(req.body.selected[i]);	//{product:product._id,line:line._id}
			console.log(selectedItem.product)
			Line.findByIdAndUpdate(selectedItem.line, {$pull : {products: { _id: ObjectId(selectedItem.product)}}});
		}
		req.flash('success','Selected products deleted.');
		res.redirect('back');
	}});


module.exports = router;