// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { createRazorpayOrder, verifyPayment } = require("../../controller/razorpay/razorpay.controller");
const isAuthenticated  = require("../../middleware/auth.middleware");

// Create Razorpay order
router.post("/create-order", isAuthenticated, createRazorpayOrder);

// Verify payment after checkout
router.post("/verify", isAuthenticated, verifyPayment);

module.exports = router;
