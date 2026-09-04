const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.protect = async (req, res, next) => {
    let token;

    // check if token exits in authorization
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if(!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
    try {
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // attach user to request object
        req.user = await User.findById(decoded.id).select("-passwordHash");
        next();
    } catch(error) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};