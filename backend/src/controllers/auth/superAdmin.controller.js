const user = require("../../models/user");

// @desc Get all users
// @route Get api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await user.find().select("-passwordHash");
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch(error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// @desc Get a single user by ID
// @route Get api/admin/users/:id
exports.getUserById = async (req, res) => {
    try {
        const user = await user.findById(req.params.id).select("-passwordHash");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            data: user
        });
    } catch(error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

//@desc Update a user by ID
// @route PUT api/admin/users/:id
exports.updateUser = async (req, res) => {
    try {
        // prevent updating password here (do it a separate "change password" route)
        const {password, ...updateData} = req.body;

        const updatedUser = await user.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select("-password");
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            data: updatedUser
        });
    } catch(error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// @desc change a user role (e.g: promote to admin)
// @route PUT api/admin/users/:id/role
exports.changeUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!role || !["super_admin", "campus_admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role provided"
            });
        }

        const user = await user.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.role = role;
        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            data: updatedUser
        });
    } catch(error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// @desc Delete a user (DELETE)
// @route DELETE api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await user.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        // prevent super admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own super admin account!"
            });
        }
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch(error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};