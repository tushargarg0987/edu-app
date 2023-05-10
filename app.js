//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const findOrCreate = require("mongoose-findorcreate");
const bcrypt = require("bcrypt");
const saltRounds = 10;
require('dotenv').config();

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        secret: "livestreamApp",
        resave: false,
        saveUninitialized: true,
        // cookie: { secure: true }
    })
);

mongoose.connect(process.env.DB_URL);

const userSchema = new mongoose.Schema({
    username: {type: String, required: true,unique: true },
    password: String,
    referralcode: { type: String, required: true, unique: true },
    refernumber: String
});

userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
    res.render("register");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/userdata", function (req, res) {
    User.find({ username: req.query.username }, function (err, foundUser) {
        console.log(foundUser[0]);
        res.send(foundUser[0]);
    })
})

app.post("/register", async function (req, res) {
    var flag = 1;
    var hashedP;
    // console.log(req);
    bcrypt
            .hash(req.body.password, saltRounds)
            .then(async (hash) => {
                // console.log('Hash ', hash)
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
                        res.redirect("/register");
                    }
                    catch (err) {
                        if (err.keyValue.username) {
                            console.log(err);
                            flag = 0;
                            res.redirect("/register");
                        }
                        else if (err.keyValue.referralcode) {
                            flag = 1;
                        }
                    }
                }
            })
            .catch(err => console.error(err.message))
    
});


app.post("/login", function (req, res) {
    User.find({ username: req.body.username }, async function (err,foundUser) {
        const hash = foundUser[0].password;
        bcrypt
            .compare(req.body.password, hash)
            .then(res => {
                console.log(res) // return true
                if (res) {
                    console.log("Success");
                }
                else {
                    console.log("Fail");
                }
            })
            .catch(err => console.error(err.message))
        
    })
    res.redirect('/login');
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started ");
});
