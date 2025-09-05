const 
express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getUsersOrder,
  getUserOrderById
} = require("../../controller/user/user.controller");
const isAuthenticated = require("../../middleware/auth.middleware");

// Get user profile
router.get("/profile", isAuthenticated, getUserProfile);

// Update user profile
router.put("/profile", isAuthenticated, updateUserProfile);

// Update user password
router.put("/password", isAuthenticated, updatePassword);

// Get user's orders
router.get("/orders", isAuthenticated, getUsersOrder);

// Get specific order by ID
router.get("/orders/:id", isAuthenticated, getUserOrderById);

module.exports = router;
