const 
express = require("express");
const router = express.Router();
const {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  applyCoupon
} = require("../../controller/coupon/coupon.controller");
const isAuthenticated = require("../../middleware/auth.middleware");

// Get all coupons with filtering and pagination
router.get("/", getAllCoupons);

// Get single coupon by ID
router.get("/:id", getCouponById);

// Create new coupon (admin only)
router.post("/", isAuthenticated, createCoupon);

// Update coupon (admin/creator only)
router.put("/:id", isAuthenticated, updateCoupon);

//apply coupon code
router.post("/apply-coupon", isAuthenticated, applyCoupon);

module.exports = router;
