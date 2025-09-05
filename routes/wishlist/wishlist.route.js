const express = require("express");
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = require("../../controller/wishlist/wishlist.controller");
const isAuthenticated = require("../../middleware/auth.middleware");

// Get user's wishlist
router.get("/", isAuthenticated, getWishlist);

// Add product to wishlist
router.post("/", isAuthenticated, addToWishlist);

// Remove product from wishlist
router.delete("/:productId", isAuthenticated, removeFromWishlist);

// Clear entire wishlist
router.delete("/", isAuthenticated, clearWishlist);

module.exports = router;
