var express = require("express");
var router  = express.Router();
var passport = require("passport");
var Line = require("../models/line");
var User = require("../models/user");
var middleware = require("../middleware");

//========== User Settings & Update Settings ==============
router.get('/settings',middleware.isLoggedIn,function(req,res){
	res.render('user/user-settings');
});
router.put('/settings',middleware.isLoggedIn,function(req,res){
	var updatedInfo = {email:req.body.email, mainAddress:req.body.mainAddress, secondAddress:req.body.secondAddress, city:req.body.city, zip:req.body.zip, isNewsletter:req.body.newsletter};
	User.findByIdAndUpdate(req.user._id,updatedInfo,function(err,updatedUser){
		if (err){
			console.log(err);
			req.flash('error',err.message);
			res.redirect('back');
		} else {
			req.flash('success','User had been updated!');
			res.redirect('/');
		}
	})
});
//========== User Orders ==================
router.get('/orders',middleware.isLoggedIn,function(req,res){
	if(req.user.isAdmin){
		User.find( {"orders" : {$elemMatch: { status: "Processing" } } }, function(err,costumers){
			if (err){
				console.log(err);
				res.redirect('back');
			} else {
			res.render('user/orders-admin',{costumers:costumers});	
			}
		})
		
	} else {
		res.render('user/orders');
	}
})
//========== User Order Update ===================
router.post('/change-shipping-info/:userId/:orderId',middleware.isLoggedIn,function(req,res){ //can be updated only if item is in "Proccess"
	User.findOneAndUpdate({'_id': req.params.userId, 'orders._id': req.params.orderId},{ $set:{
		'orders.$.buyerInfo.address_city':req.body.city,
		'orders.$.buyerInfo.address_country':req.body.country,
		'orders.$.buyerInfo.address_line1':req.body.address,
		'orders.$.buyerInfo.address_zip':req.body.zip,
		'orders.$.buyerInfo.name':req.body.name
	}}, function(err){
		if (err){
			console.log(err);
			res.redirect('back');
		} else {
			req.flash('success','Information has been changed and saved.');
			res.redirect('back');
		}
	})
})
//========== Admin Order Update ==================
router.post('/update-order/:userId/:orderId',middleware.isAdmin,function(req,res){
User.findOneAndUpdate({'_id': req.params.userId,'orders._id': req.params.orderId},{$set:{'orders.$.status': 'Shipped','orders.$.tracking': req.body.tracking}},function(err,result){
        if (err) {
            console.log(err);
            res.redirect('back');
        } else {
			req.flash('success','Item has been upated!');
			res.redirect('back')
        }
    })
});
//========= Password change ===============
router.get('/change-password',middleware.isLoggedIn,function(req,res){
	res.render('user/passwordChange');
})
router.post('/change-password',middleware.isLoggedIn,function(req,res){
	User.findById(req.user._id,function(err,user){
		if (err){
			req.flash('error',err.message);
			res.redirect('back');
		} else {
			user.changePassword(req.body.oldPassword,req.body.newPassword, function(err){
				if (err){
	            	req.flash('error',err.message);
	            	res.redirect('back');			
	            } else {
	            	req.flash('success','password has been changed');
	            	res.redirect('/user/settings');
	            }
			})			
		}
	})
});

module.exports = router;