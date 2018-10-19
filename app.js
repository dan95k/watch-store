let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

var express			= require('express'),
	app				= express(),
	bodyParser		= require('body-parser'),
	mongoose		= require('mongoose'),
	passport		= require('passport'),
	localStrategy	= require('passport-local'),
	methodOverride  = require("method-override"),
	stripe 			= require('stripe')('stripe_code');
	flash			= require('connect-flash'),
	middleware 		= require("./middleware");


//=========== Models ================
var	User		= require('./models/user'),
	Line 		= require('./models/line');

//=========== Routes ================
var adminAddRoutes		= require('./routes/adminAdd'),
	adminDeleteRoutes	= require('./routes/adminDelete'),
	indexRoutes			= require('./routes/index'),
	userRoutes			= require('./routes/user');
	lineRoutes			= require('./routes/line');

//=========== Server Setup ==========
app.set('view engine','ejs');
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
mongoose.connect(process.env.databaseURL, { useNewUrlParser: true });
app.use(flash());
app.use(require("express-session")({
	secret:"Secret Pass",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser 	= req.user;
	if(req.user){
	res.locals.total   		= middleware.getTotal(req.user.cart);	
	}
	res.locals.error		= req.flash('error');
	res.locals.success		= req.flash('success');
	next();
});

app.use("/", indexRoutes);
app.use("/add", adminAddRoutes);
app.use("/delete", adminDeleteRoutes);
app.use("/user", userRoutes);
app.use("/line", lineRoutes);

app.listen(port,function(){
	console.log('Listening at port ' + port);
});
