var express = require("express");
var router  = express.Router();
var stripe 	= require('stripe')('stripe_code');
var passport = require("passport");
var async	= require('async');
var nodemailer = require('nodemailer');
var crypto	= require('crypto');


var Line = require("../models/line");
var User = require("../models/user");
var middleware = require("../middleware");

//=========== Main ===================

router.get('/', function(req,res){
	Line.find({},function(err,allLines){
		if (err){
			console.log(err)
		} else {
		res.render('index', {lines:allLines});
		}
	})
});

//=========== Login ==================
router.post('/login',passport.authenticate('local', {failureRedirect: '/',failureFlash: true}),function(req, res) {
		req.flash('success', 'Welcome back ' + req.body.username);
		res.redirect('/');
    }
);
//=========== Register ===============
router.get('/register',middleware.notLoggedIn,function(req,res){
	res.render('user/register');
});
router.post('/register',middleware.notLoggedIn,function(req,res){
	var newUser = {username:req.body.username, email:req.body.email, mainAddress:req.body.mainAddress, secondAddress:req.body.secondAddress, city:req.body.city, country:req.body.country, zip:req.body.zip, isNewsletter:req.body.newsletter};
	User.register(newUser,req.body.password, function(err,createdUser){
		if (err){
			req.flash('error',err.message);
			return res.redirect('/register');
		}
		passport.authenticate('local')(req,res,function(){
			req.flash('success','Welcome ' + req.body.username);
			res.redirect('/');
		})
	})
});
//========= Log Out ===================
router.get('/logout',middleware.isLoggedIn,function(req,res){
	req.logout();
	req.flash('success','You have logged out!');
	res.redirect('/');
});
//======== Forgot Password ============
router.get('/forgot-password',middleware.notLoggedIn,function(req,res){
	res.render('user/forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot-password');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: [Email_Username],
          pass: [Email_Password]
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'Store Admin',
        subject: 'Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot-password');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot-password');
    }
    res.render('user/passReset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: [Email_Username],
          pass: [Email_Password]
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'learntocodeinfo@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

//=========== Add To WishList ===============
router.post('/add-to-wishlist',middleware.isLoggedIn,function(req,res){
	var selectedItem = JSON.parse(req.body.product);
	var lineId = selectedItem.lineId;
	var productId = selectedItem.productId;
			Line.findById(lineId, function(err,line){
				if(err){
					req.flash('error',err.message);
					res.redirect('/');
				} else {
					if(line.products.length === 1 && line.products['0']._id.toString() === productId){ //if the line has 1 item and its the desired one
						var newItemToWishlist = {product:line.products['0'],lineId:lineId};
						req.user.wishlist.push(newItemToWishlist);
						req.user.save();
					}
					else{ //if there are several items in line
						var i = 0;
						line.products.forEach(function(product){
							if(product._id.toString() === productId){
								var newItemToWishlist = {product:line.products[i],lineId:lineId};
								req.user.wishlist.push(newItemToWishlist);
								req.user.save();	
							}
							i++;
						})
					}
				}
			})
		req.flash('success','Item has added to your wishlist');
		res.redirect(req.get('referer'));				
	});
//=========== Add To Cart From Wishlist ===========
router.get('/add-to-cart-from-wishlist/:lineId/:productId',middleware.isLoggedIn,function(req,res){
	var lineId = req.params.lineId;
	var productId = req.params.productId;
			Line.findById(lineId, function(err,line){ //adding item to cart
				if(err){
					req.flash('error',err.message);
					res.redirect('/');
				} else {
					if(line.products.length === 1 && line.products['0']._id.toString() === productId){
						var newItemToCart = line.products['0'];
						req.user.cart.push(newItemToCart);
						req.user.save();
					}
					else{
						var i = 0;
						line.products.forEach(function(product){
							if(product._id.toString() === productId){
								var newItemToCart = line.products[i];
								req.user.cart.push(newItemToCart);
								req.user.save();	
							}
							i++;
						})
					}
				}
			});
			//removing item from wishlist after adding to cart
	if(req.user.wishlist.length === 0){}
	if(req.user.wishlist.length === 1){
		req.user.wishlist.splice(0, 1);
	} if (req.user.wishlist.length > 1){
		var i = 0;
		var finish = 0;
		req.user.wishlist.forEach(function(item){
			if (finish === 1){
				return;
			}
			if(item.product._id.toString() === productId){
				finish++;
				req.user.wishlist.splice(i, 1);
			}
			i++;
		})
	}
	req.flash('success','Item has added to your cart');
	res.redirect(req.get('referer'));	
});

//=========== Remove From WishList ===========
router.get('/remove-from-wishlist/:Id',middleware.isLoggedIn,function(req,res){
			if (req.user.wishlist.length === 0 ){};
			if (req.user.wishlist.length === 1){
				req.user.wishlist.splice(0, 1);
				req.user.save();
				res.redirect('back');
			}
			if(req.user.wishlist.length > 1){
				var i = 0;
				req.user.wishlist.forEach(function(item){
					if(item.product._id.toString() === req.params.Id){
						req.user.wishlist.splice(i, 1)
						req.user.save();
						res.redirect('back');
					}
					i++;
				})
			}
		}
	);	
//=========== Add To Cart ===============
router.post('/add-to-cart',middleware.isLoggedIn,function(req,res){
	var selectedItem = JSON.parse(req.body.product);
	var lineId = selectedItem.lineId;
	var productId = selectedItem.productId;
			Line.findById(lineId, function(err,line){
				if(err){
					req.flash('error',err.message);
					res.redirect('/');
				} else {
					if(line.products.length === 1 && line.products['0']._id.toString() === productId){
						var newItemToCart = line.products['0'];
						req.user.cart.push(newItemToCart);
						req.user.save();
					}
					else{
						var i = 0;
						line.products.forEach(function(product){
							if(product._id.toString() === productId){
								var newItemToCart = line.products[i];
								req.user.cart.push(newItemToCart);
								req.user.save();	
							}
							i++;
						})
					}
				}
			});
	req.flash('success','Item has added to your cart');
	res.redirect(req.get('referer'));			
	});
//=========== Remove From Cart ==========
//remove specific item from cart
router.get('/remove-from-cart/:productId',middleware.isLoggedIn,function(req,res){
			if (req.user.cart.length === 0 ){};
			if (req.user.cart.length === 1){
				req.user.cart.splice(0, 1);
				req.user.save();
				res.redirect('back');
			}
			if(req.user.cart.length > 1){
				var i = 0;
				req.user.cart.forEach(function(item){
					if(item._id.toString() === req.params.productId){
						req.user.cart.splice(i, 1)
						req.user.save();
						res.redirect('back');
					}
					i++;
				})
			}
		}
	);
//remove all items from cart
router.post('/remove-from-cart',middleware.isLoggedIn,function(req,res){
	if(req.body.deleteAll === 'true'){
				req.user.cart.splice(0, req.user.cart.length);
				req.user.save();
				req.flash('success','You have deleted all items from the shopping cart');
				res.redirect('back');
		}
	}
);
//=========== About  ====================
router.get('/about',function(req,res){
	res.render('about');
});

//========== Payment ===================
router.post('/charge',middleware.isLoggedIn,function(req,res){
	var token = req.body.stripeToken;
	var chargeAmount = middleware.getTotal(req.user.cart)*100;
	var charge = stripe.charges.create({
		amount: chargeAmount,
		currency: 'usd',
		source: token,
		receipt_email: req.user.email
	}, function(err, charge){
		if (err && err.type === "StripeCardError"){
			req.flash('error','Your card has been declined');
			res.redirect('/');
		} else {
			var order = {_id:charge.id,amount:charge.amount,currency:charge.currency,status:'Processing',buyerInfo:charge.source,products:[]};
			if(req.user.cart.length === 1){
				order.products.push(req.user.cart['0']);
			} else {
				req.user.cart.forEach(function(item){
					order.products.push(item);
				});
			}
			req.user.cart.splice(0, req.user.cart.length);
			req.user.orders.push(order);
			req.user.save();
			res.render('payment/pay-success',{order:order});
		}}
	);
});


module.exports = router;