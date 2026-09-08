import user from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "secretkey", {
        expiresIn: "30d",
    });
};

// @desc    Register a new user(public, default role: student)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if user already exists
        const existingUser = await user.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email is already registered" });
        }

        // Create new user
        const newUser = await user.create({
            name,
            email,
            password,
            phone
        });

        // Generate token
        const token = generateToken(newUser._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user (public)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const existingUser = await user.findOne({ email }).
select("+passwordHash");
        if (!existingUser) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }
        const isMatch = await existingUser.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        // check if user is active
        if (!existingUser.isActive) {
            return res.status(403).json({ success: false, message: "Account is deactivated" });
        }

        // Generate token
        const token = generateToken(existingUser._id);
        res.status(200).json({
            success: true,
            token,
            user: {
                _id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                phone: existingUser.phone
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await user.findById(req.user._id).select("-passwordHash");
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};