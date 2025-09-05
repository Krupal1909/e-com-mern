// app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const DbConnect = require("./database/db");
const path = require('path')
// Routes
const userRoute = require("./routes/user/user.route");
const authRoute = require("./routes/auth/auth.route");
const cartRoute = require("./routes/cart/cart.route");
const productRoute = require("./routes/product/product.route");
const couponRoute = require("./routes/coupon/coupon.route");
const categoryRoute = require("./routes/category/category.route");
const orderRoute = require("./routes/order/order.route")
const paymentRoutes = require("./routes/razorpay/razorpay.route");
const wishlistRoute = require("./routes/wishlist/wishlist.route")
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // frontend origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/coupon", couponRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/razorpay", paymentRoutes)
app.use("/api/v1/wishlist", wishlistRoute)


// Test route
app.get("/test", (req, res) => {
  res.json({ success: true, message: "API is working 🚀" });
});

// Connect DB
DbConnect();

module.exports = app;
