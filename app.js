//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const findOrCreate = require("mongoose-findorcreate");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        secret: "livestreamApp",
        resave: false,
        saveUninitialized: true,
    })
);

mongoose.connect("mongodb://localhost:27017/streamApp");

const userSchema = new mongoose.Schema({
    username: {type: String, required: true,unique: true },
    password: String,
    referralcode: { type: String, required: true, unique: true },
    refernumber: String
});

userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);


// To fetch the user data
app.get("/userdata", function (req, res) {
    User.find({ username: req.query.username }, function (err, foundUser) {
        console.log(foundUser[0]);
        res.send(foundUser[0]);
    })
})


// To register new user [input - {username,password}, output - (Registered - for success and Username already taken - if username already taken)]
app.post("/register", async function (req, res) {
    var flag = 1;
    var hashedP;
    bcrypt
            .hash(req.body.password, saltRounds)
            .then(async (hash) => {
                hashedP = hash;
                while (flag) {
                    try {
                        var user = new User({
                            username: req.body.username,
                            password: hashedP,
                            referralcode: (Math.random() * 1000000).toFixed(0)
                        });
                        await user.save();
                        flag = 0;
                        res.send("Registered");
                    }
                    catch (err) {
                        if (err.keyValue.username) {
                            console.log(err);
                            flag = 0;
                            res.send("Username already taken");
                        }
                        else if (err.keyValue.referralcode) {
                            flag = 1;
                        }
                    }
                }
            })
            .catch(err => console.error(err.message))
    
});

// To login a user [input - {username,password}, output - (Success or Fail)]
app.post("/login", function (req, res) {
    User.find({ username: req.body.username }, async function (err,foundUser) {
        if (foundUser[0]) {
            const hash = foundUser[0].password;
                bcrypt
                    .compare(req.body.password, hash)
                    .then(response => {
                        // console.log(response) // return true
                        if (response) {
                            res.send("Success");
                        }
                        else {
                            res.send("Fail");
                        }
                    })
                    .catch(err => console.error(err.message))
                
            
        }
        else {
            res.send("User not found");
        }
    })
});

app.listen(3000, function () {
    console.log("Server started at port 3000");
});
