const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  forgotPassword,
} = require("../../controller/auth/auth.controller");
const isAuthenticated = require("../../middleware/auth.middleware");
const upload = require("../../middleware/multer.middleware");

// Register user
router.post("/register", upload.single("avatar"), registerUser);

// Login user
router.post("/login", loginUser);

// Logout user
router.post("/logout", isAuthenticated, logoutUser);

// Verify email
router.get("/verify-email/:token", isAuthenticated, verifyEmail);

// Forgot password
router.post("/forgot-password", isAuthenticated, forgotPassword);

module.exports = router;
