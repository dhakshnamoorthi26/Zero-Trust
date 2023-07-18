//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://0.0.0.0:27017/hospital-login",{useNewUrlParser: true})

var secret = "";
var trustLevel = 0;
var user_name = "";
var password = "";
var id = "";
var v = 0;

const loginSchema = new mongoose.Schema({
  username: String,
  password: String,
  trust: Number})

const Login = new mongoose.model("login", loginSchema);

const secretSchema = new mongoose.Schema({
  secret: String
})

const Secret = new mongoose.model("secret", secretSchema);

Secret.findOne({sno: 1})
  .then((foundSecret) => {
    secret = foundSecret.secret;
 })

app.get("/", function(req,res){
  res.render("home");
})

app.get("/login", function(req,res){
  res.render("login");
})

app.get("/register", function(req,res){
  res.render("register");
})

app.get("/delete", function(req,res){
  Secret.updateOne({sno: 1}, {secret: ""})
  .then((err) => {
    console.log(err);
 });
  res.redirect("/")
})

app.get("/add", function(req,res){
  res.render("add");
})

app.get("/modify", function(req,res){
  res.render("modify", {secret: secret});
})

app.get("/captcha", function(req,res){
  res.render("captcha");
  update(trustLevel);
})

app.get("/postcaptcha", function(req,res){
  if(trustLevel<0.9){
    res.render("secrets", {secret: secret, trust: trustLevel});
  } else {
    res.redirect("/otp")
  }
})

app.get("/otp", function(req,res){
  res.render("otp");
})

app.get("/qr", function(req,res){
  if(trustLevel<0.95){
    res.render("secrets", {secret: secret, trust: trustLevel});
  } else {
    res.redirect("https://qrcodescan.in/")
  }
})

app.get("/secrets", function(req,res){
  res.render("secrets", {secret: secret, trust: trustLevel});
})

/*const isAuthenticated = (req, res, next) => {
    if (req.session.user && req.session.trustValue) {
        // If user is authenticated, update trust value
        User.findOneAndUpdate({ username: req.session.user }, { $inc: { trustValue: 1 } }, (err, user) => {
            if (err) {
                res.status(500).json({ message: 'Error updating trust value' });
            } else {
                req.session.trustValue = user.trustValue;
                next();
            }
        });
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
};
*/
app.post("/register", function(req,res){

  var userEmail = req.body.username;
  var userPassword = req.body.password;

  var newUser = new Login({
    username: userEmail,
    password: userPassword,
  });

  newUser.save();
  res.redirect("/login");

})

app.post("/login", function(req,res){

  var user = req.body.username;
  var pwd = req.body.password;

  Login.findOne({username:user})
    .then((foundUser) => {
        if(foundUser){
            if(foundUser.password === pwd){
              trustLevel = foundUser.trust;
              user_name = foundUser.username;
              pass_word = foundUser.password;
              id = foundUser._id;
              v = foundUser._v;
              if(trustLevel<0.8){
                res.render("secrets", {secret: secret, trust: trustLevel});
              } else {
                res.redirect("/captcha")
              }
            }
        }
   })
   .catch((error) => {
console.log(error);
       res.send(400, "Bad Request");
   });
});

app.post("/add", function(req,res){
  var addSecret = req.body.addsecret;
  secret = secret + addSecret;
  Secret.updateOne({sno: 1}, {secret: secret})
  .then((err) => {
    console.log(err);
 });
 res.redirect("/");
})

app.post("/modify", function(req,res){
  var modifySecret = req.body.modifysecret;
  console.log(req.body.modifysecret);
  secret = modifySecret;
  Secret.updateOne({sno: 1}, {secret: secret})
  .then((err) => {
    console.log(err);
 });
  res.redirect("/");
})

async function update(value){
  value = value + Number((Math.random()/100).toFixed(4));
  console.log(trustLevel + " " + value + " " + user_name);
  await Login.updateMany({username: user_name}, { $set: { trust: value } });
}

app.listen(3000, function(){
  console.log("server running on port 3000");
})
