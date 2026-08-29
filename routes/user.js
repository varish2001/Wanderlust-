const express = require('express');
const wrapAsync = require("../utils/wrapAsync");
const userController = require("../controllers/users");
const { isLoggedIn, validateSignup, validateLogin, storeReturnTo } = require("../middlewares");

const router = express.Router({mergeParams: true});

router.get("/signup", userController.renderSignupForm);
router.post("/signup", validateSignup, storeReturnTo, wrapAsync(userController.signup));

router.get("/login", userController.renderLoginForm);
router.post("/login", validateLogin, storeReturnTo, wrapAsync(userController.login));

router.get("/dashboard", isLoggedIn, wrapAsync(require("../controllers/listings").dashboard));

router.get("/logout", isLoggedIn, userController.logout);

module.exports = router;
