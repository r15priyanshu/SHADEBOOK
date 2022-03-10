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
  name:"shadebook_account_cookie",
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
  res.locals.blogpost_success = req.flash('blogpost_success');
  res.locals.blogpost_failure = req.flash('blogpost_failure');
  res.locals.past_work_error=req.flash("past_work_error");
  res.locals.past_work_success=req.flash("past_work_success");
  res.locals.social_links_success=req.flash("social_links_success");
  res.locals.social_links_failure=req.flash("social_links_failure");
  res.locals.error = req.flash('error');
  next();
});

//multer setting for image uploading for featured photos
var storage5=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,"./public/uploads/"+req.user.username+"/profile pic");
  },
  filename:function(req,file,cb){
    cb(null,file.fieldname+'-'+ Date.now() + path.extname(file.originalname));
  }
});

var uploadProfilePic=multer({
  storage:storage5,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
}).single("profilePic");


//multer setting for image uploading for featured photos
var storage1=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,"./public/uploads/"+req.user.username+"/featured_photos");
  },
  filename:function(req,file,cb){
    console.log(file.originalname);
    cb(null,file.fieldname+'-'+ Date.now() + path.extname(file.originalname));
  }
});
var uploadFeaturedPhotos=multer({
  storage:storage1,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
}).single("myimage");


//multer setting for image during past work adding
var storage2=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,"./public/uploads/"+req.user.username+"/past work");
  },
  filename:function(req,file,cb){
    cb(null,file.fieldname+'-'+ Date.now() + path.extname(file.originalname));
  }
});
var uploadPhoto=multer({
  storage:storage2,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
}).single("myphoto");


//multer setting for video during past work adding
var storage3=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,"./public/uploads/"+req.user.username+"/past work");
  },
  filename:function(req,file,cb){
    cb(null,file.fieldname+'-'+ Date.now() + path.extname(file.originalname));
  }
});


var uploadVideo=multer({
  storage:storage3,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(mp4|3gp|mkv|mpeg|mpeg4|avi)$/)) {
        return cb(new Error('Only video files are allowed!'));
    }
    cb(null, true);
  }
}).single("myvideo");



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

//creating schema
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


//setting up passportLocalMongoose for userSchema
userSchema.plugin(passportLocalMongoose);
//creating mongoose model
const User = new mongoose.model("User", userSchema);
const Theme = new mongoose.model("Theme", themeSchema);
const Contact=new mongoose.model("Contact",contactSchema);
const Admin=new mongoose.model("Admin",adminSchema);


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//CREATING LOCAL createStrategy
var localStrategy = require("passport-local").Strategy;
passport.use(new localStrategy(
  function(username, password, done) {
    User.findOne({
      username: username
    }, function(err, foundData) {
      if (err) {
        return done(err);
      }
      if (!foundData) {
        return done(null, false,{message:"User doesnot exists"}); //data not found so authentication is not successfull so null,false
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

//get request for login
  app.get("/home/login", function(req, res) {
    res.render("login");
  });

//post request for login
app.post('/userlogin',
  passport.authenticate('local', { failureRedirect: '/home/login' ,failureFlash:true}),
  function(req, res){
    //on successfull login
    console.log(req.user.username+" logged in successfully");
    res.redirect("/"+req.user.uniqueusername+"/profile");
  });

//home route
app.get("/", function(req, res) {
  res.redirect("/home/login");
});

//get route for contact us page
app.get("/home/contactUs",function(req,res){
  res.render("contactUs");
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
  req.logout();
  res.redirect("/");
});

//get route for register page
app.get("/home/register", function(req, res) {
  res.render("register");
});

//post route for registering user
app.post("/register",function(req,res){
  var err;
  var username = req.body.username;
  var fname = req.body.fname;
  var lname = req.body.lname;
  var password = req.body.password;
  var uniqueusername=req.body.uniqueusername;
  var mobile=req.body.mobile;

  //validation check
  if(!username || !fname || !lname || !password || !uniqueusername || !mobile){
    err = "enter all details"
    res.render("register", {
      err: err
    });
  }

  if(typeof err=="undefined"){
    User.findOne({username:req.body.username},function(error,foundData){
      if(error)
        console.log(error);
      else if(foundData){
        console.log("user already exists");
        req.flash("error_msg","Email already exists");
        res.redirect("/home/register");
      }
      //end of if part to check for email id registered or not
      else{
        User.findOne({
          uniqueusername: req.body.uniqueusername
        }, function(error, foundData) {
          if (error) console.log(error);
          if (foundData){
            console.log("username taken");
            req.flash("error_msg","User name taken ! please provide unique Username.");
            res.redirect("/home/register");
          }
          else{

            bcrypt.hash(req.body.password, 10, function(err, hash) {
              // Store hash in your password DB.
              if (err) throw err;
              password = hash;

              const user = new User({
                username: req.body.username,
                password: password,
                fname: req.body.fname,
                lname: req.body.lname,
                uniqueusername:req.body.uniqueusername,
                isprivate:"yes",
                mobile:Number(req.body.mobile),
                selectedtheme:"default",
                profilepic:"blankdp",
                facebookLink:"",
                linkedinLink:"",
                instagramLink:""
              });

              user.save(function(err, data) {
                if (err) throw err;
                else{
                  try{
                    console.log(__dirname+"/public/uploads/"+username);
                    fs.mkdirSync(__dirname+"/public/uploads/"+username);

                  }
                  catch(err){
                    if(err.code == 'EEXIST')
                    {
                      console.log("directory exists");
                    }
                    else{
                      console.log(err);
                    }
                  }
                  req.flash("success_msg","Registered successfully... Login to continue");
                  res.redirect("/home/login");
                }
              });
            });

          }
        });
      }
    });
    //end of User.findOne main part
  }
  //end of if part of undefined
});


//route for profile
app.get("/:uniqueusername/profile", function(req, res) {
  if (req.isAuthenticated()) {
        res.render("profile", {user:req.user});
  } else {
    res.redirect("/home/login");
  }
});


//handling post route for uploading profile pic
app.post("/uploadProfilePic",function(req,res){
  //first create folder of profile pic inside the each user account and then store all images inside that one
  try{
    fs.mkdirSync(__dirname+"/public/uploads/"+req.user.username+"/profile pic");
  }
  catch(err){
    if(err.code == 'EEXIST')
    {
      console.log("directory exists");
    }
    else{
      console.log(err);
    }}
    //now call upload function to upload files
  uploadProfilePic(req,res,function(err){
    if(err) {
        req.flash("error_msg",'Only image files are allowed!');
        res.redirect("/profile");
    }
    else{
      User.updateOne({_id:req.user._id},{profilepic:req.file.filename},function(error){
        if(error) throw error;
        else
        {console.log("one profile photo added successfully by "+req.user.username);
        res.redirect("/"+req.user.uniqueusername+"/profile");
      }
      });
    }
  });
});

//handling post request for updating user Profile
app.post("/updateProfile", function(req, res){
  User.updateOne({
    _id:req.user._id
  }, {
    fname: req.body.fname,
    lname: req.body.lname,
    bio:req.body.bio
  }, function(err) {
    if (err)
      console.log(err);
    else {
      console.log("profile updated by "+req.user.username);
      res.redirect("/"+req.user.uniqueusername+"/profile#PC");
    }

  });
});

//post route for facebookLink
app.post("/addSocialLinksFacebook" , function(req,res){
  console.log("worked hurray!");
  if(validUrl.isUri(req.body.facebookLink)){
    console.log("link is correct")
    User.updateOne( {_id:req.user._id} , {facebookLink:req.body.facebookLink} , function(error){
      if(error)
        console.log(error);
      else{
        req.flash("social_links_success",'link added successfully');
        res.redirect("/"+req.user.uniqueusername+"/profile#SL");
      }
    } );
  }
  else{
    console.log("link is wrong");
    req.flash("social_links_failure",'Please enter valid url.');
    res.redirect("/"+req.user.uniqueusername+"/profile#SL");
  }
});

//post route for linkedInLink
app.post("/addSocialLinksLinkedIn" , function(req,res){
  console.log("worked hurray!");
  if(validUrl.isUri(req.body.linkedInLink)){
    console.log("link is correct")
    User.updateOne( {_id:req.user._id} , {linkedinLink:req.body.linkedInLink} , function(error){
      if(error)
        console.log(error);
      else{
        req.flash("social_links_success",'link added successfully');
        res.redirect("/"+req.user.uniqueusername+"/profile#SL");
      }
    } );
  }
  else{
    console.log("link is wrong");
    req.flash("social_links_failure",'Please enter valid url.');
    res.redirect("/"+req.user.uniqueusername+"/profile#SL");
  }
});

//post route for instagramLink
app.post("/addSocialLinksInstagram" , function(req,res){
  console.log("worked hurray!");
  if(validUrl.isUri(req.body.instagramLink)){
    console.log("link is correct")
    User.updateOne( {_id:req.user._id} , {instagramLink:req.body.instagramLink} , function(error){
      if(error)
        console.log(error);
      else{
        req.flash("social_links_success",'link added successfully');
        res.redirect("/"+req.user.uniqueusername+"/profile#SL");
      }
    } );
  }
  else{
    console.log("link is wrong");
    req.flash("social_links_failure",'Please enter valid url.');
    res.redirect("/"+req.user.uniqueusername+"/profile#SL");
  }
});


//handling post route for uploading Featured Photos
app.post("/uploadFeaturedPhotos",function(req,res){
  //first create folder of featured photos inside the each user account and then store all images inside that one
  try{
    fs.mkdirSync(__dirname+"/public/uploads/"+req.user.username+"/featured_photos");
  }
  catch(err){
    if(err.code == 'EEXIST')
    {
      console.log("directory exists");
    }
    else{
      console.log(err);
    }}
    //now call upload function to upload files
  uploadFeaturedPhotos(req,res,function(err){
    if(err) {
        console.log(err);
        req.flash("error_msg",'Only image files are allowed!');
        res.redirect("/"+req.user.uniqueusername+"/profile#FF");
    }
    else{
      User.updateOne({_id:req.user._id},{$push:{featuredPhotos:{imagename:req.file.filename}}},function(error){
        if(error) throw error;
        else {
          console.log("one featured photo added successfully by"+req.user.username);
          req.flash("success_msg",'One new photo added successfully!');
          res.redirect("/"+req.user.uniqueusername+"/profile#FF");
        }
      });
    }
  });
});

//handling post route for deleting featured photos
app.post("/deleteFeaturedPhotos/:photoid",function(req,res){
  User.updateOne({_id:req.user._id},{$pull:{featuredPhotos:{_id:req.params.photoid}}},function(error){
    if(error) throw error;
    else {
            try{
              fs.unlinkSync(__dirname+"/public/uploads/"+req.user.username+"/featured_photos/"+req.body.featuredPhotosImageName);
            }
            catch(err){
              console.log(err);
            }
      console.log("one featured photo deleted successfully by"+req.user.username);
      res.redirect("/"+req.user.uniqueusername+"/profile#FF");
    }

  });
});

//post request for adding new photos in past WORKS
app.post("/pastWork/photo",function(req,res){
  //first create folder of past work inside the each user account and then store all images inside that one
  try{
    fs.mkdirSync(__dirname+"/public/uploads/"+req.user.username+"/past work");
  }
  catch(err){
    if(err.code == 'EEXIST')
    {
      console.log("directory exists");
    }
    else{
      console.log(err);
    }
  }

    uploadPhoto(req,res,function(err){
      if(err){
          console.log(err);
          req.flash("past_work_error",'please select image files only!');
          res.redirect("/"+req.user.uniqueusername+"/profile#PW");
      }
      else{

        User.updateOne({_id:req.user._id},{$push:{pastWork:{description:req.body.photoDescription,filename:req.file.filename,content_type:"photo"}}},function(err){
          if(err) throw err;
          else{
            req.flash("past_work_success",'successfully added!');
            console.log("one past work photo added successfully by "+req.user.username);
            res.redirect("/"+req.user.uniqueusername+"/profile#PW");
          }
        });
    }
});

});

//post request for adding new videos in past WORKS
app.post("/pastWork/video",function(req,res){
  //first create folder of past work inside the each user account and then store all images inside that one
  try{
    fs.mkdirSync(__dirname+"/public/uploads/"+req.user.username+"/past work");
  }
  catch(err){
    if(err.code == 'EEXIST')
    {
      console.log("directory exists");
    }
    else{
      console.log(err);
    }
  }

    uploadVideo(req,res,function(err){
      if(err){
          console.log(err);
          req.flash("past_work_error",'please select video files only');
          res.redirect("/"+req.user.uniqueusername+"/profile#PW");
      }
      else{
        User.updateOne({_id:req.user._id},{$push:{pastWork:{description:req.body.videoDescription,filename:req.file.filename,content_type:"video"}}},function(err){
          if(err) throw err;
          else{
            req.flash("past_work_success",'successfully added!');
            console.log("one past work video added successfully by "+req.user.username);
            res.redirect("/"+req.user.uniqueusername+"/profile#PW");
          }
    });
  }
});
});

//post request for adding new links of past work
app.post("/pastWork/link",function(req,res){
          if (validUrl.isUri(req.body.newLink)){
                User.updateOne({_id:req.user._id},{$push:{pastWork:{link:req.body.newLink,content_type:"link",description:req.body.linkDescription}}},function(err){
                if(err) throw err;
                else{
                  req.flash("past_work_success",'successfully added!');
                  console.log("one past work link added successfully by "+req.user.username);
                  res.redirect("/"+req.user.uniqueusername+"/profile#PW");
                }
          });
        }else{
              console.log('Not a valid url');
              req.flash("past_work_error",'link not added ! Please provide a valid Url !');
              res.redirect("/"+req.user.uniqueusername+"/profile#PW");
          }
});

//handling post route for deleting pastWorkPhoto
app.post("/deletePastPhoto/:photoid",function(req,res){
  User.updateOne({_id:req.user._id},{$pull:{pastWork:{_id:req.params.photoid}}},function(error){
    if(error) throw error;
    else {
      try{
        fs.unlinkSync(__dirname+"/public/uploads/"+req.user.username+"/past work/"+req.body.photoFileName);
      }
      catch(err){
        console.log(err);
      }
      console.log("one past work photo post deleted successfully by "+req.user.username);
    }
    res.redirect("/"+req.user.uniqueusername+"/profile#PW");
  });
});

//handling post route for deleting pastWorkVideo
app.post("/deletePastVideo/:videoid",function(req,res){
  User.updateOne({_id:req.user._id},{$pull:{pastWork:{_id:req.params.videoid}}},function(error){
    if(error) throw error;
    else {
      try{
        fs.unlinkSync(__dirname+"/public/uploads/"+req.user.username+"/past work/"+req.body.videoFileName);
      }
      catch(err){
        console.log(err);
      }
      console.log("one past work video deleted successfully by "+req.user.username);
    }
    res.redirect("/"+req.user.uniqueusername+"/profile#PW");
  });
});

//handling post route for deleting pastWork links
app.post("/deletePastLinks/:linkid",function(req,res){
  User.updateOne({_id:req.user._id},{$pull:{pastWork:{_id:req.params.linkid}}},function(error){
    if(error) throw error;
    else
    {
      console.log("one past work link deleted successfully by"+req.user.username);
    res.redirect("/"+req.user.uniqueusername+"/profile#PW");
    }

  });
});


//handling post route for viewing pastWork Post
app.post("/ViewPastPost/:postid",function(req,res){
  User.findOne({_id:req.user._id},{pastWork:{$elemMatch:{_id:req.params.postid}},uniqueusername:1},function(err,foundData){
    if(err) throw err;
    else{
      res.render("postView.ejs",{foundData:foundData});
    }
  });
});


//otp verification
app.post("/generateEmailOtp",function(req,res){
  if(req.isAuthenticated()){
    var otp=Math.floor(100000 + Math.random() * 900000);
    User.updateOne({_id:req.user._id},{email_otp:otp},function(err){
      if(err) throw err;
      else{
        console.log("otp generated for email verification = "+otp);
        res.render("profile",{emailotp:true,user:req.user});
      }
    });

  }else{
    res.redirect("/home/login");
  }
});

app.post("/verifyEmailOtp",function(req,res){
  if(req.isAuthenticated()){
    User.findOne({_id:req.user._id},function(err,data){
      if(err) throw err;
      if(data){
          if(Number(req.body.submitted_otp) == data.email_otp){
            User.updateOne({_id:req.user._id},{emailVerified:Number("1")},function(err){
              if (err) throw err;
              else{
                  console.log("email verified");
                  res.redirect("/"+req.user.uniqueusername+"/profile#PV");
              }
            });
          }
          else{
            console.log("wrong otp entered");
            res.redirect("/"+req.user.uniqueusername+"/profile#PV");
          }
      }else{
        res.redirect("/"+req.user.uniqueusername+"/profile#PV");
      }
    });
  }else{
    res.redirect("/home/login");
  }
});

app.post("/generateMobileOtp",function(req,res){
  if(req.isAuthenticated()){
    var otp=Math.floor(100000 + Math.random() * 900000);
    User.updateOne({_id:req.user._id},{mobile_otp:otp},function(err){
      if(err) throw err;
      else{
        console.log("otp generated for mobile verification = "+otp);
        res.render("profile",{mobileotp:true,user:req.user});
      }
    });

  }else{
    res.redirect("/home/login");
  }
});

app.post("/verifyMobileOtp",function(req,res){
  if(req.isAuthenticated()){
    User.findOne({_id:req.user._id},function(err,data){
      if(err) throw err;
      if(data){
          if(Number(req.body.submitted_otp) == data.mobile_otp){
            User.updateOne({_id:req.user._id},{mobileVerified:Number("1")},function(err){
              if (err) throw err;
              else{
                  console.log("mobile number verified");
                  res.redirect("/"+req.user.uniqueusername+"/profile#PV");
              }
            });
          }
          else{
            console.log("wrong otp entered");
            res.redirect("/"+req.user.uniqueusername+"/profile#PV");
          }
      }else{
        res.redirect("/"+req.user.uniqueusername+"/profile#PV");
      }
    });
  }else{
    res.redirect("/home/login");
  }
});


//get route for blogpost
app.get("/blogpost", function(req, res) {
  if (req.isAuthenticated()) {
    User.findOne({
      _id:req.user._id
    }, function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        res.render("blogPosts", {user:foundUser});
      }
    });
  } else {
    res.redirect("/home/login");
  }
});

// post route for adding blog post
app.post("/blogpost/addPost",function(req,res){
  User.updateOne({_id:req.user._id} , {$push:{blogPosts:{postTitle:req.body.postTitle,postBody:req.body.postBody }}} ,function(error){
      if(error)
      {
        req.flash("blogpost_failure","Post Adding Failed !!");
        res.redirect("/blogpost");
      }
      else{
        req.flash("blogpost_success","One new post added successfully !!");
        res.redirect("/blogpost");
      }
  });
});

//post route for deleting a blog post
app.post("/blogpost/deletepost/:postid",function(req,res){
  User.updateOne({_id:req.user._id}, {$pull:{blogPosts:{_id:req.params.postid}}}  ,function(error){
    if(error)
    {
      req.flash("blogpost_failure","Post Deletion Failed !!");
      res.redirect("/blogpost");
    }
    else{
      req.flash("blogpost_success","Post Deleted Successfully !!");
      res.redirect("/blogpost");
    }
  });
});



//get route for themes section
app.get("/themes",function(req,res){
  if(req.isAuthenticated())
  {
    Theme.find({},function(err,data){
      if(err) throw err;
      else{
        res.render("themes",{user:req.user,Themes:data});
      }
    });

  }
  else
  {
    res.redirect("/home/login");
  }
});

//post route for theme selection
app.post("/chooseTheme/:themeid",function(req,res){
  Theme.findOne({_id:req.params.themeid},function(err,data){
    if(err) throw err;
    else{
      console.log(data);
      User.updateOne({_id:req.user._id},{selectedtheme:data.themetitle},function(error){
        if(error) throw error;
        else {
                  res.redirect("/themes");
        }
      });
    }
  });
});


//get route for settings section
app.get("/settings",function(req,res){
  if( req.isAuthenticated() ){
    res.render("settings",{user:req.user});
  }
  else{
    res.redirect("/home/login");
  }
});

//post route for handling password updation
app.post("/settings/updatePassword",function(req,res){
  User.findOne({_id:req.user._id},function(err,foundData){
    if (err) throw err;
    if(foundData){
      var new_password=req.body.password;
      bcrypt.hash(new_password,10,function(err,hash){
        if(err) throw err;
        if(hash)
        {
          User.updateOne({_id:req.user._id},{password:hash},function(err){
            if(err) throw err;
            else{
              console.log("password updated successfully");
              req.flash("success_msg","Password Updated Successfully");
              res.redirect("/settings");
            }
          });
        }
      });
    }else{
      req.flash("error_msg","Password Update Failed");
      res.redirect("/settings");
    }
  });
});


//post route for handling mobile updation
app.post("/settings/updateMobile",function(req,res){
  User.updateOne({_id:req.user._id},{mobile:req.body.mobile,mobileVerified:Number("0")},function(err){
    if(err) throw err;
    else{
      console.log("mobile updated successfully");
      req.flash("success_msg","Mobile Number Updated Successfully");
      res.redirect("/settings");
    }
  });
});

//post route for handling uniqueusername updation
app.post("/settings/updateUniqueUsername",function(req,res){
  User.findOne({uniqueusername:req.body.uniqueusername},function(err,foundData){
    if (err) throw err;
    if(foundData){
        console.log("username already taken! Try with other Unique Username");
        req.flash("error_msg","username already taken! Try with other Unique Username");
        res.redirect("/settings");
    }else{
      User.updateOne({_id:req.user._id},{uniqueusername:req.body.uniqueusername},function(err){
        if(err) throw err;
        else{
          console.log("Username updated successfully");
          req.flash("success_msg","Username Updated successfully");
          res.redirect("/settings");
        }
      });
    }
  });
});

//post route for handling private account settings
app.post("/settings/private",function(req,res){
  User.updateOne({_id:req.user._id},{isprivate:req.body.makeprivate},function(err){
    if(err) throw err;
    else{
      req.flash("success_msg","Changes made successfully");
      res.redirect("/settings");
    }
  });
});



//handling any other routes if requested
app.use("/",function(req,res){
  res.send("<h1>ERROR ! page Not Found</h1>")
});

//server
app.listen(3000, function() {
  console.log("server started in development mode on port 3000");
});
