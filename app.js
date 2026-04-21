const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");//help creating layouts/templates in ejs
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");
require("dotenv").config();



const listingsRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

main().then( () => {
    console.log("Connected to DB");
})

.catch((err) => {
    console.log(err);
});

async function main(){
    await mongoose.connect(dbUrl);
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);//setting ejs-mate as the template engine for ejs files
// Serve static assets from the public directory (CSS, images, client JS)
app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
    secret: "thisshouldbeabettersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};

app.get('/', async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});


app.use((req, res, next)=> {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});


// app.get("/demouser", async(req,res)=> {
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "student",

//     })
//     let registerUser = await User.register(fakeUser, "helloworld");
//     res.send("User registered successfully");
// })

    

app.use('/listings', listingsRouter);
app.use('/listings/:id/reviews', reviewRouter);
app.use('/', userRouter);



// app.get("/testListing", async (req, res) => {
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description : "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     });
    
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successfull testing");

// });

app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.render("error.ejs", {err});
    // res.status(statusCode).render("error", { statusCode, message });
});

app.listen(8080, () => {
    console.log('Server is listening to port 8080');
});
