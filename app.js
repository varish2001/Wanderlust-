const express = require('express');
const app = express();
const http = require("http");
const fs = require("fs");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");//help creating layouts/templates in ejs
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const User = require("./models/user.js");
const connectDb = require("./config/db");
const env = require("./config/env");
const listingController = require("./controllers/listings");



const listingsRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const sessionStoreUrl = env.dbUrl;

const requestPrototypes = [http.IncomingMessage.prototype, express.request, app.request].filter(Boolean);
for (const requestProto of requestPrototypes) {
    const queryDescriptor = Object.getOwnPropertyDescriptor(requestProto, "query");
    if (queryDescriptor && !queryDescriptor.set) {
        Object.defineProperty(requestProto, "query", {
            configurable: true,
            enumerable: queryDescriptor.enumerable ?? true,
            get() {
                if (Object.prototype.hasOwnProperty.call(this, "_queryOverride")) {
                    return this._queryOverride;
                }

                return queryDescriptor.get.call(this);
            },
            set(value) {
                this._queryOverride = value;
            },
        });
    }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);//setting ejs-mate as the template engine for ejs files
// Serve static assets from the public directory (CSS, images, client JS)
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
    // Express 5 exposes req.query as a read-only getter, so we sanitize
    // mutable request objects and leave query parsing alone here.
    const sanitizeRequestValue = (key) => {
        if (!req[key]) {
            return;
        }

        mongoSanitize.sanitize(req[key]);
    };

    sanitizeRequestValue("body");
    sanitizeRequestValue("params");
    sanitizeRequestValue("headers");
    next();
});
app.use(
    helmet({
        crossOriginResourcePolicy: false,
        contentSecurityPolicy: false,
    })
);

if (env.isProduction) {
    app.set("trust proxy", 1);
}

const sessionOptions = {
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: env.isProduction,
    store: MongoStore.create({
        mongoUrl: sessionStoreUrl,
        crypto: { secret: env.sessionSecret },
        touchAfter: 24 * 3600,
    }),
    cookie: {
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: "lax",
        secure: env.isProduction,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
    done(null, user._id);
});

app.use((req, res, next)=> {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    res.locals.currentPath = req.path;
    res.locals.pageTitle = "WanderLust";
    res.locals.pageDescription = "Discover stays for every kind of trip.";
    next();
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

app.get("/", listingController.home);



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
    if (res.headersSent) {
        return next(err);
    }

    try {
        fs.appendFileSync(path.join(__dirname, "debug.log"), `${err.stack || err}\n\n`);
    } catch (logError) {
        console.error("Failed to write debug log:", logError);
    }
    console.error(err.stack || err);
    res.status(statusCode).render("error", {
        err: {
            ...err,
            stack: err.stack,
            message,
            statusCode,
        },
        pageTitle: statusCode === 404 ? "Page Not Found | WanderLust" : "Something went wrong | WanderLust",
        pageDescription: message,
    });
});

connectDb(env.dbUrl)
    .then(() => {
        app.listen(env.port, () => {
            console.log(`Server is listening on port ${env.port}`);
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
        process.exit(1);
    });
