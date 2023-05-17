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
app.use(bodyParser.json());
app.use(
    session({
        secret: "livestreamApp",
        resave: false,
        saveUninitialized: true,
    })
);

mongoose.connect("mongodb+srv://tushargarg0987:tushargarg@cluster0.7clzuuu.mongodb.net/?retryWrites=true&w=majority");

const userSchema = new mongoose.Schema({
    username: {type: String, required: true,unique: true },
    password: String,
    referralcode: { type: String, required: true, unique: true },
    refernumber: String,
    courses: []
});

const courseSchema = new mongoose.Schema({
    courseId: {type: String, required: true,unique: true },
    courseName: String,
    classes: [
        {
            classId: String,
            classNumber: String,
            classTitle: String,
            classUrl: String
        }
    ]
});

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true },
    username: String,
    amount: String,
    forCourse : String,
})

userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Course = new mongoose.model("Course", courseSchema);
const Payment = new mongoose.model("Payment", paymentSchema);

app.get("/", function (req, res) {
    res.send("Hello");
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
    console.log(req.body);
    bcrypt
            .hash(req.body.password, saltRounds)
            .then(async (hash) => {
                console.log('Hash ', hash)
                
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
                            res.send("Invalid User");
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
        if (foundUser[0]) {
            const hash = foundUser[0].password;
        bcrypt
            .compare(req.body.password, hash)
            .then(response => {
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
            res.send("Fail");
        }
    })
});

app.post('/addCourse', async (req,res) => {
    try {
        const data = req.body;
        var newCourse = new Course({
            courseId: data.courseId,
            courseName: data.courseName,
            classes: data.classes
        })
        await newCourse.save();
        res.send("Added");
    }
    catch (err) {
        if (err.keyValue.courseId) {
            res.send("Invalid CourseId");
        }
        else {
            console.log(err);
            res.send("Unexpected error");
        }
    }
})

app.post('/subscribeCourse', (req,res) => {
    User.find({ username: req.body.username }, (err,foundUser) => {
        if (foundUser[0]) {
            const courses = foundUser[0].courses;
            courses.push(req.body.courseId);
            User.findOneAndUpdate({ username: req.body.username },{
                courses: courses
            })
            res.send("Updated");
        }
        else {
            res.send('User not found');
        }
    })
})

app.get('/courseData', (req,res) => {
    Course.find({ courseId: req.body.courseId },(err,foundCourse)=> {
        if (foundCourse[0]) {
            res.send(foundCourse[0]);
        }
        else {
            res.send("Course not found");
        }
    })
})

app.post('/addPayment', async (req, res) => {
    try {
        const data = req.body;
        var newPayment = new Payment({
            paymentId: data.paymentId,
            username: data.username,
            amount: data.amount,

        })
        await newPayment.save();
    }
    catch (err) {
        if (err.keyValue.paymentId) {
            res.send("Invalid PaymentId");
        }
        else {
            console.log(err);
            res.send("Unexpected error");
        }
    }
});

app.get('/userPayments', (req, res) => {
    Payment.find({ username: req.body.username }, (err, foundpayments) => {
        if (foundpayments[0]) {
            res.send(foundpayments);
        }
        else {
            res.send("No payments")
        }
    })
})

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started ");
});
