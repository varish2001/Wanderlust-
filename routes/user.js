const express = require('express');
const router = express.Router({mergeParams: true});
const User = require("../models/user.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { userSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");

const SALT_ROUNDS = 10;

const validateUser = (req, res, next) => {
    const { error } = userSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        return next(new ExpressError(400, errMsg));
    } else {
        next();
    }
};

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const createAuthToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            username: user.username,
        },
        process.env.JWT_SECRET || "wanderlust-jwt-secret",
        { expiresIn: "7d" }
    );
};

const sendLoginFailure = (req, res) => {
    req.flash("error", "Invalid email or password");
    return res.redirect("/login");
};

const loginUserIntoSession = (req, user) => {
    return new Promise((resolve, reject) => {
        req.login(user, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

const compareLegacyPassword = (enteredPassword, user) => {
    if (!user?.hash || !user?.salt) {
        return Promise.resolve(false);
    }

    return new Promise((resolve, reject) => {
        crypto.pbkdf2(
            enteredPassword,
            Buffer.from(user.salt, "hex"),
            25000,
            512,
            "sha256",
            (err, derivedKey) => {
                if (err) {
                    return reject(err);
                }

                const storedHash = Buffer.from(user.hash, "hex");

                if (storedHash.length !== derivedKey.length) {
                    return resolve(false);
                }

                resolve(crypto.timingSafeEqual(storedHash, derivedKey));
            }
        );
    });
};

router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

router.post("/signup", validateUser, async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const trimmedUsername = username.trim();

        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { username: trimmedUsername },
            ],
        });

        if (existingUser) {
            req.flash("error", "User already exists. Please use a different email or username.");
            return res.redirect("/signup");
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        console.log("[SIGNUP] incoming password:", password);
        console.log("[SIGNUP] stored password:", hashedPassword);

        const newUser = new User({
            email: normalizedEmail,
            username: trimmedUsername,
            password: hashedPassword,
        });

        const registeredUser = await newUser.save();
        const token = createAuthToken(registeredUser);

        await loginUserIntoSession(req, registeredUser);

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });

        req.flash("success", "Welcome to WanderLust");
        const redirectUrl = req.session.returnTo || "/listings";
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    } catch (e) {
        console.error("SIGNUP ERROR", e);
        req.flash("error", "Unable to sign up right now. Please try again.");
        res.redirect("/signup");
    }
});

router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { username: normalizedEmail },
            ],
        });

        console.log("[LOGIN] incoming password:", password);
        console.log("[LOGIN] stored password:", user?.password || user?.hash || "USER_NOT_FOUND");

        if (!user) {
            console.log("[LOGIN] bcrypt compare result:", false);
            return sendLoginFailure(req, res);
        }

        let isPasswordValid = false;

        if (user.password) {
            isPasswordValid = await bcrypt.compare(password, user.password);
        } else if (user.hash && user.salt) {
            const legacyPasswordMatched = await compareLegacyPassword(password, user);

            if (legacyPasswordMatched) {
                const migratedHash = await bcrypt.hash(password, SALT_ROUNDS);
                user.password = migratedHash;
                user.hash = undefined;
                user.salt = undefined;
                await user.save();
                isPasswordValid = await bcrypt.compare(password, user.password);
            }
        }

        console.log("[LOGIN] bcrypt compare result:", isPasswordValid);

        if (!isPasswordValid) {
            return sendLoginFailure(req, res);
        }

        const token = createAuthToken(user);

        await loginUserIntoSession(req, user);

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });

        req.flash("success", "Welcome back to WanderLust!");
        const redirectUrl = req.session.returnTo || "/listings";
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error("LOGIN ERROR", error);
        return next(error);
    }
});

router.get("/logout", (req, res, next) => {
    if (typeof req.logout !== 'function') {
        req.flash("error", "Logout failed.");
        return res.redirect("/listings");
    }
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.clearCookie("token");
        req.flash("success", "Logged out successfully!");
        res.redirect("/listings");
    });
});

module.exports = router;
