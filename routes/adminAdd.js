var express = require("express");
var router  = express.Router();
var Line = require("../models/line");
var User = require("../models/user");
var middleware = require("../middleware");

//============ Adding =================
router.get('/line',middleware.isAdmin,function(req,res){
	res.render('new/newLine');
});
router.post('/line',middleware.isAdmin,function(req,res){
	var newLine = {name:req.body.name,image:req.body.image, description:req.body.description};
	Line.create(newLine,function(err,createdLine){
		if (err){
			console.log(err);
			req.flash('error',err.message);
			res.redirect('/');
		} else {
			req.flash('success','New line of products has been created!');
			res.redirect('/');
		}
	})
});

router.get('/product',middleware.isAdmin,function(req,res){
	Line.find({},function(err,productLines){
		if (err){
			console.log(err);
			res.redirect('/');
		} else {
			res.render('new/newProduct', {lines:productLines});
		}
	})
});
router.post('/product',middleware.isAdmin,function(req,res){
	Line.findById(req.body.line, function(err,foundLine){
		if (err){
			console.log(err);
			res.redirect('/add/product');
		} else {
			var ObjectID = require('mongodb').ObjectID;
			var newProduct = {
				_id: new ObjectID(),
				line:foundLine.name,
				model:req.body.model,
				manufacturer:req.body.manufacturer,
				price:req.body.price,
				image:req.body.image,
				waterResist:req.body.waterResist,
				gender:req.body.gender,
				watchType:req.body.watchType,
				warranty:req.body.warranty,
				description:req.body.description
			};
			foundLine.products.push(newProduct);
			foundLine.save();
			req.flash('success','New product has been added!');
			res.redirect('/');
		}
	})
});

module.exports = router;
