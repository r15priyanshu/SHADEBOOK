//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//const bcrypt = require('bcrypt');
const flash = require('connect-flash');
//const multer=require("multer");
const path=require("path");
const fs=require("fs");

const app = express();

app.use(express.static("public"));
//to access shadebook_account contents
app.use(express.static("../shadebook_account/public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

//initializing session
app.use(session({
  name:"shadebook_home_cookie",
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
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.private_account_error_msg = req.flash('private_account_error_msg');
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
  blogPosts:[{
    postTitle:String,
    postBody:String
  }],
  featuredPhotos:[{
    imagename:String
  }],
  pastWork:[{
    filename:String,
    content_type:String,
    description:String,
    link:String
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
  themeId:Number,
  themetitle:String,
  image:String
});
//creating admin schema
const adminSchema = new mongoose.Schema({
  username:String,
  password:String
});


mongoose.set("useCreateIndex", true);


//setting up passportLocalMongoose
userSchema.plugin(passportLocalMongoose);

//creating mongoose model
const User = new mongoose.model("User", userSchema);
const Theme = new mongoose.model("Theme", themeSchema);
const Contact=new mongoose.model("Contact",contactSchema);
const Admin=new mongoose.model("Admin",adminSchema);

//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());


  //get request for login
  app.get("/home/login", function(req, res) {
    res.render("login");
  });

//home route
app.get("/", function(req, res) {
  res.render("home");
});


//get route for contact us page
app.get("/home/contactUs",function(req,res){
  res.render("contactUs");
});

//get route for searchuser page
app.get("/home/searchUser",function(req,res){
  res.render("search");
});

//post route for searchUser
app.post("/home/searchUsername",function(req,res){
  console.log(req.body.uniqueusername);
  res.redirect("/home/searchUser/"+req.body.uniqueusername);
});

//get route for userprofile
app.get("/home/searchUser/:uniqueusername",function(req,res){
  console.log(req.params.uniqueusername);
  User.findOne({uniqueusername:req.params.uniqueusername},function(err,data){
    if(err)
      throw err;
    if(data){
      if(data.isprivate=="no"){
        if(data.selectedtheme=="default"){
            res.render("profile",{user:data});
        }else{
            res.render("themeNotAvailable",{user:data});
        }
      }else{
        req.flash("private_account_error_msg","Sorry ! User Account is not public.");
        res.redirect("/home/searchUser");
        //res.render("profileNotFound",{info:"Sorry ! User Account is not public."});
      }
    }else{
      req.flash("error_msg","Sorry ! User Not Found.");
      res.redirect("/home/searchUser");
      //res.render("profileNotFound",{info:"Sorry ! User Not Found."});
    }
  });
});

//get route for privacy policy page
app.get("/home/privacyPolicy",function(req,res){
  res.render("privacyPolicy");
});

//get route for terms and condition page
app.get("/home/termsAndCondition",function(req,res){
  res.render("termsAndCondition");
});


//post route for contact us page
app.post("/home/contactUs",function(req,res){
  const newContact= new Contact({
    fullname:req.body.fullname,
    email:req.body.email,
    comment:req.body.comments
  });
  newContact.save().then(function(){
      req.flash("success_msg","Thank You!");
      res.redirect("/home/contactUs");
  })
});


//route for logout
app.get("/home/logout", function(req, res) {
  console.log(req.user.username+" logged out successfully");
  req.logout();
  res.redirect("/");
});


//handling post route for viewing pastWork Post
app.post("/home/searchUser/:uniqueusername/ViewPastPost/:userid/:postid",function(req,res){
  User.findOne({_id:req.params.userid},{pastWork:{$elemMatch:{_id:req.params.postid}},username:1},function(err,foundData){
    if(err) throw err;
    else{
      console.log(foundData);
      res.render("postView.ejs",{foundData:foundData});
    }
  });
});


app.use("/",function(req,res){
  res.send("<h1>ERROR ! page Not Found</h1>")
});

//server
app.listen(4000, function() {
  console.log("server started in development mode on port 4000");
});
