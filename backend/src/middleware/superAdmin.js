exports.isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === "super_admin") {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: "Access denied. You do not have permission to perform this action."
        })
    }
};