var Line = require("../models/line");
var User = require("../models/user");

var middlewareObj = {};

middlewareObj.isLoggedIn = function (req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/");
};
middlewareObj.notLoggedIn = function(req, res, next){
    if(!req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You are already logged in!");
    res.redirect("/");
};
middlewareObj.isAdmin = function (req,res,next){
	if (!req.user || !req.user.isAdmin === true){
			req.flash('error','You dont have a premission to do that!');
			res.redirect("/");
	} else {
		next();
	}
};
middlewareObj.getTotal = function(cart){
	if(!cart){
	}
	else{
		var total = 0;
		cart.forEach(function(product){
			var productPrice = parseInt(product.price);
			total+=productPrice;
		})
		return total;
	}
};

module.exports = middlewareObj;