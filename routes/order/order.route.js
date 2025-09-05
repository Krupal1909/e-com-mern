                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrderDetails,
  getAllOrders,
  updateOrderStatus,
} = require("../../controller/orders/orders.controller");
const isAuthenticated = require("../../middleware/auth.middleware");
const upload = require("../../middleware/multer.middleware");
// Create new order
router.post("/",upload.array("images", 5), isAuthenticated, createOrder);

// Get all orders (admin only)
router.get("/", isAuthenticated, getAllOrders);

// Get single order by ID
router.get("/:id", isAuthenticated, getOrderDetails);

// Update order status (admin only)
router.put("/:id/status", isAuthenticated, updateOrderStatus);

module.exports = router;
