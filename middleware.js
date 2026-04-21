module.exports.isLoggedIn = (req, res, next) => {
    console.log(req.user);
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash("error", "You must be signed in first!");
        return res.redirect("/login");
    }

    next();
};
