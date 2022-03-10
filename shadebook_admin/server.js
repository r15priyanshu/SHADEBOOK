//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const multer=require("multer");
const path=require("path");
const fs=require("fs");
const validUrl = require('valid-url');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

//initializing session
app.use(session({
  name:"shadebook_admin_cookie",
  secret: "There is no any secret",
  resave: false,
  saveUninitialized: false
}));

//initialising passport
app.use(passport.initialize());
//passport to use session
app.use(passport.session());
app.use(flash());

// Global Vars
app.use(function (req, res, next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

//database connection
mongoose.connect("mongodb://localhost:27017/SHADEBOOK_DB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//creating Contact Schema
const contactSchema=new mongoose.Schema({
  fullname:String,
  email:String,
  comment:String,
});
//creating User schema
const userSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  uniqueusername:String,
  username: String,
  password: String,
  mobile: Number,
  bio:String,
  facebookLink:String,
  linkedinLink:String,
  instagramLink:String,
  featuredPhotos:[{
    imagename:String
  }],
  pastWork:[{
    filename:String,
    content_type:String,
    description:String,
    link:String
  }],
  blogPosts:[{
    postTitle:String,
    postBody:String
  }],
  profilepic:String,
  selectedtheme:String,
  email_otp:Number,
  mobile_otp:Number,
  mobileVerified:Number,
  emailVerified:Number,
  isprivate:String,
});
//creating theme schema
const themeSchema = new mongoose.Schema({
  themetitle:String,
  image:String
});
//creating admin schema
const adminSchema = new mongoose.Schema({
  username:String,
  password:String
});

mongoose.set("useCreateIndex", true);


//setting up passportLocalMongoose for adminSchema
adminSchema.plugin(passportLocalMongoose);
//creating mongoose model
const User = new mongoose.model("User", userSchema);
const Theme = new mongoose.model("Theme", themeSchema);
const Contact=new mongoose.model("Contact",contactSchema);
const Admin=new mongoose.model("Admin",adminSchema);

passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());


//CREATING LOCAL createStrategy
var localStrategy = require("passport-local").Strategy;
passport.use(new localStrategy(
  function(username, password, done) {
    Admin.findOne({
      username: username
    }, function(err, foundData) {
      if (err) {
        return done(err);
      }
      if (!foundData) {
        return done(null, false,{message:"This admin account doesnot exists !! Enter valid credentials !!"}); //data not found so authentication is not successfull so null,false
      }
      bcrypt.compare(password,foundData.password,function(err,match){
        if(err){
          return done(null,false);
        }
        if(!match){
          return done(null,false,{message:"Password incorrect"});
        }
        if(match){
          return done(null,foundData);
        }
      });
    });
  }
));
//home route
app.get("/", function(req, res) {
  res.redirect("/login");
});

//get request for login
  app.get("/login", function(req, res) {
    res.render("login");
  });

//post request for login
app.post('/adminlogin',
  passport.authenticate('local', { failureRedirect: '/login' ,failureFlash:true}),
  function(req, res){
    //on successfull login
    console.log(req.user.username+" logged in successfully");
    res.redirect("/administrator/users");
  });

//route for allusers
  app.get("/administrator/users", function(req, res) {
    if (req.isAuthenticated()) {
          console.log(req.user);
          User.find({},function(err,data){
            if(err) throw err;
            if(data){
                console.log(data);
                res.render("users",{users:data});
            }else{
              console.log("error in administrator/users url");
            }
          })
    } else {
      res.redirect("/login");
    }
  });

  //get route for register page
  app.get("/register", function(req, res) {
    res.render("register");
  });

  //post route for registering admins
  app.post("/register",function(req,res){
    var err;
    var username = req.body.username;
    var password = req.body.password;
    //validation check
    if(!username || !password){
      err = "enter all details"
      res.render("register", {
        err: err
      });
    }

    if(typeof err=="undefined"){
      Admin.findOne({username:req.body.username},function(error,foundData){
        if(error)
          console.log(error);
        else if(foundData){
          console.log("user already exists");
          req.flash("error_msg","Admin account already exists");
          res.redirect("/register");
        }
        //if part to check for username registered or not
        else{
          //register Now
                      bcrypt.hash(req.body.password, 10, function(err, hash) {
                        // Store hash in your password DB.
                        if (err) throw err;
                        password = hash;
                        const admin = new Admin({
                          username: req.body.username,
                          password: password,
                        });

                        admin.save(function(err, data){
                          if (err) throw err;
                          else{
                            req.flash("success_msg","New Admin Account Created Successfully!!");
                            res.redirect("/login");
                          }
                        });
                      });
        }
      });
      //end of Admin.findOne main part
    }
    //end of if part of undefined
  });

  
  //post route for deleting user
  app.post("/administrator/deleteuser/:userid",function(req,res){
    User.deleteOne({_id:req.params.userid},function(err){
      if(err) throw err;
      else{
        req.flash("success_msg","User Deleted Successfully!!");
        res.redirect("/administrator/users");
      }
    });
  });


  //route for all themes
  app.get("/administrator/themes", function(req, res) {
    if (req.isAuthenticated()) {
          console.log(req.user);
          Theme.find({},function(err,data){
            if(err) throw err;
            if(data){
                res.render("themes",{themes:data});
            }else{
              console.log("error in theme url");
            }
          })
    } else {
      res.redirect("/login");
    }
  });

  //post route for deleting theme
  app.post("/administrator/themes/deletetheme/:themeid",function(req,res){
    Theme.deleteOne({_id:req.params.themeid},function(err){
      if(err) throw err;
      else{
        req.flash("success_msg","Theme Deleted Successfully!!");
        res.redirect("/administrator/themes");
      }
    });
  });

  //route for all themes
  app.get("/administrator/admins", function(req, res) {
    if (req.isAuthenticated()) {
          console.log(req.user);
          Admin.find({},function(err,data){
            if(err) throw err;
            if(data){
                console.log(data);
                res.render("admins",{admins:data,loggedAdmin:req.user.username});
            }else{
              console.log("error in admins url");
            }
          })
    } else {
      res.redirect("/login");
    }
  });

  //post route for deleting admin
  app.post("/administrator/admins/deleteadmin/:adminid",function(req,res){
    Admin.deleteOne({_id:req.params.adminid},function(err){
      if(err) throw err;
      else{
        req.flash("success_msg","Account Deleted Successfully!!");
        res.redirect("/administrator/admins");
      }
    });
  });

  //route for all messages
  app.get("/administrator/messages", function(req, res) {
    if (req.isAuthenticated()) {
          console.log(req.user);
          Contact.find({},function(err,data){
            if(err) throw err;
            if(data){
                res.render("messages",{messages:data});
            }else{
              console.log("error in messages url");
            }
          })
    } else {
      res.redirect("/login");
    }
  });
  //post route for deleting theme
  app.post("/administrator/messages/deletemessage/:messageid",function(req,res){
    Contact.deleteOne({_id:req.params.messageid},function(err){
      if(err) throw err;
      else{
        req.flash("success_msg","Message Deleted Successfully!!");
        res.redirect("/administrator/messages");
      }
    });
  });




//route for logout
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

//handling any other routes if requested
app.use("/",function(req,res){
  res.send("<h1>ERROR ! page Not Found</h1>")
});

//server
app.listen(5000, function() {
  console.log("server started in development mode on port 5000");
});
