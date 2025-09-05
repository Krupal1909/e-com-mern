const User = require("../../models/auth/user.model");
const Product = require("../../models/product/product.model");
const catchAsyncErrors = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utills/ErrorHandler");

// Get user's wishlist
const getWishlist = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: "wishlist",
    select: "name price images category brand ratings numOfReviews",
  });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Wishlist fetched successfully",
    wishlist: user.wishlist,
    count: user.wishlist.length,
  });
});

// Add product to wishlist
const addToWishlist = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new ErrorHandler("Product ID is required", 400));
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const user = await User.findById(req.user.id);

  // Check if product is already in wishlist
  if (user.wishlist.includes(productId)) {
    return next(new ErrorHandler("Product already in wishlist", 400));
  }

  user.wishlist.push(productId);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Product added to wishlist successfully",
    wishlist: user.wishlist,
  });
});

// Remove product from wishlist
const removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  const user = await User.findById(req.user.id);

  // Check if product is in wishlist
  if (!user.wishlist.includes(productId)) {
    return next(new ErrorHandler("Product not found in wishlist", 404));
  }

  user.wishlist = user.wishlist.filter(
    (id) => id.toString() !== productId.toString()
  );
  await user.save();

  res.status(200).json({
    success: true,
    message: "Product removed from wishlist successfully",
    wishlist: user.wishlist,
  });
});

// Clear entire wishlist
const clearWishlist = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.wishlist.length === 0) {
    return next(new ErrorHandler("Wishlist is already empty", 400));
  }

  user.wishlist = [];
  await user.save();

  res.status(200).json({
    success: true,
    message: "Wishlist cleared successfully",
    wishlist: user.wishlist,
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
};
