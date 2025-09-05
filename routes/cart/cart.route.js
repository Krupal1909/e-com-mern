const 
express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} = require("../../controller/cart/cart.controller");
const isAuthenticated = require("../../middleware/auth.middleware");

// Get user's cart
router.get("/", isAuthenticated, getCart);

// Add item to cart
router.post("/add", isAuthenticated, addToCart);

// Update cart item quantity
router.put("/item/:itemId", isAuthenticated, updateCartItem);

// Remove item from cart
router.delete("/item/:itemId", isAuthenticated, removeFromCart);

module.exports = router;
