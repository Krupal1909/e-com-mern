const Cart = require("../../models/cart/cart.model");
const Product = require("../../models/product/product.model");
const catchAsyncErrors = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utills/ErrorHandler");

// Get user's cart
const getCart = catchAsyncErrors(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate({
    path: "items.product",
    select: "name price images category brand stock isActive",
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  res.status(200).json({
    success: true,
    message: "Cart fetched successfully",
    cart,
  });
});

// Add item to cart
const addToCart = catchAsyncErrors(async (req, res, next) => {
  const { productId, quantity = 1, variant } = req.body;

  if (!productId) {
    return next(new ErrorHandler("Product ID is required", 400));
  }

  // Check if product exists and is active
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new ErrorHandler("Product not found or inactive", 404));
  }

  // Check stock availability
  if (product.stock < quantity) {
    return next(new ErrorHandler("Insufficient stock", 400));
  }

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId.toString() &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;

    if (product.stock < newQuantity) {
      return next(new ErrorHandler("Insufficient stock", 400));
    }

    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item to cart
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
      variant,
    });
  }

  await cart.save();

  // Populate cart before sending response
  cart = await Cart.findById(cart._id).populate({
    path: "items.product",
    select: "name price images category brand stock isActive",
  });

  res.status(200).json({
    success: true,
    message: "Item added to cart successfully",
    cart,
  });
});

// Update cart item quantity
const updateCartItem = catchAsyncErrors(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return next(new ErrorHandler("Valid quantity is required", 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorHandler("Cart not found", 404));
  }

  const itemIndex = cart.items.findIndex(
    (item) => item._id.toString() === itemId.toString()
  );

  if (itemIndex === -1) {
    return next(new ErrorHandler("Item not found in cart", 404));
  }

  // Check product stock
  const product = await Product.findById(cart.items[itemIndex].product);
  if (product.stock < quantity) {
    return next(new ErrorHandler("Insufficient stock", 400));
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  // Populate cart before sending response
  const updatedCart = await Cart.findById(cart._id).populate({
    path: "items.product",
    select: "name price images category brand stock isActive",
  });

  res.status(200).json({
    success: true,
    message: "Cart item updated successfully",
    cart: updatedCart,
  });
});

// Remove item from cart
const removeFromCart = catchAsyncErrors(async (req, res, next) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorHandler("Cart not found", 404));
  }

  const itemIndex = cart.items.findIndex(
    (item) => item._id.toString() === itemId.toString()
  );

  if (itemIndex === -1) {
    return next(new ErrorHandler("Item not found in cart", 404));
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  // Populate cart before sending response
  const updatedCart = await Cart.findById(cart._id).populate({
    path: "items.product",
    select: "name price images category brand stock isActive",
  });

  res.status(200).json({
    success: true,
    message: "Item removed from cart successfully",
    cart: updatedCart,
  });
});

module.exports = {
  removeFromCart,
  addToCart,
  updateCartItem,
  getCart,
};
