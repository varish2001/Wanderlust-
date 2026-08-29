const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/user");

const SALT_ROUNDS = 10;

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const loginUserIntoSession = (req, user) =>
    new Promise((resolve, reject) => {
        req.login(user, (error) => {
            if (error) {
                return reject(error);
            }
            resolve();
        });
    });

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
            (error, derivedKey) => {
                if (error) {
                    return reject(error);
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

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup", {
        pageTitle: "Create Account | WanderLust",
        pageDescription: "Join WanderLust and start sharing or saving stays.",
    });
};

module.exports.signup = async (req, res) => {
    const { username, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const trimmedUsername = username.trim();

    const existingUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { username: trimmedUsername }],
    });

    if (existingUser) {
        req.flash("error", "User already exists. Please try a different email or username.");
        return res.redirect("/signup");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = new User({
        email: normalizedEmail,
        username: trimmedUsername,
        password: hashedPassword,
    });

    const registeredUser = await newUser.save();

    await loginUserIntoSession(req, registeredUser);

    req.flash("success", "Welcome to WanderLust.");
    const redirectUrl = res.locals.returnTo || "/dashboard";
    res.redirect(redirectUrl);
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login", {
        pageTitle: "Login | WanderLust",
        pageDescription: "Log in to manage your trips, reviews, and wishlist.",
    });
};

module.exports.login = async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
        $or: [{ email: normalizedEmail }, { username: normalizedEmail }],
    });

    if (!user) {
        req.flash("error", "Invalid email or password.");
        return res.redirect("/login");
    }

    let isPasswordValid = false;

    if (user.password) {
        isPasswordValid = await bcrypt.compare(password, user.password);
    } else if (user.hash && user.salt) {
        const legacyPasswordMatched = await compareLegacyPassword(password, user);
        if (legacyPasswordMatched) {
            user.password = await bcrypt.hash(password, SALT_ROUNDS);
            user.hash = undefined;
            user.salt = undefined;
            await user.save();
            isPasswordValid = true;
        }
    }

    if (!isPasswordValid) {
        req.flash("error", "Invalid email or password.");
        return res.redirect("/login");
    }

    await loginUserIntoSession(req, user);

    req.flash("success", "Welcome back to WanderLust.");
    const redirectUrl = res.locals.returnTo || "/dashboard";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((error) => {
        if (error) {
            return next(error);
        }

        req.flash("success", "Logged out successfully.");
        res.redirect("/");
    });
};
