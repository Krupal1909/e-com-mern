const Coupon = require("../../models/coupon/coupon.model");

const catchAsyncErrors = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utills/ErrorHandler");
const cartModel = require("../../models/cart/cart.model");

// Get all coupons with filtering and pagination
const getAllCoupons = catchAsyncErrors(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    isActive,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;
  // Build query object
  let query = {};

  // Filter by active status if provided
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  const coupons = await Coupon.find(query)
    .populate("createdBy", "name email")
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit));

  const totalCoupons = await Coupon.countDocuments(query);
  const totalPages = Math.ceil(totalCoupons / limit);

  res.status(200).json({
    success: true,
    message: "Coupons fetched successfully",
    coupons,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalCoupons,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

// Get single coupon by ID
const getCouponById = catchAsyncErrors(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id).populate(
    "createdBy",
    "name email"
  );

  if (!coupon) {
    return next(new ErrorHandler("Coupon not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Coupon fetched successfully",
    coupon,
  });
});

// Create new coupon
const createCoupon = catchAsyncErrors(async (req, res, next) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minimumOrderAmount,
    maximumDiscountAmount,
    usageLimit,
    validFrom,
    validUntil,
  } = req.body;

  // Check if coupon code already exists
  const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (existingCoupon) {
    return next(new ErrorHandler("Coupon code already exists", 400));
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    minimumOrderAmount,
    maximumDiscountAmount,
    usageLimit,
    validFrom,
    validUntil,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    coupon,
  });
});

// Update coupon
const updateCoupon = catchAsyncErrors(async (req, res, next) => {
  let coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ErrorHandler("Coupon not found", 404));
  }

  // Check if user is authorized to update
  if (
    req.user.role !== "admin" &&
    coupon.createdBy.toString() !== req.user._id.toString()
  ) {
    return next(new ErrorHandler("Unauthorized to update this coupon", 403));
  }

  const { code, ...updateData } = req.body;

  if (code && code.toUpperCase() !== coupon.code) {
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return next(new ErrorHandler("Coupon code already exists", 400));
    }
    updateData.code = code.toUpperCase();
  }

  coupon = await Coupon.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    message: "Coupon updated successfully",
    coupon,
  });
});

const applyCoupon = catchAsyncErrors(async (req, res, next) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    return next(new ErrorHandler("Coupon code is required", 400));
  }

  // Find coupon
  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
  if (!coupon) {
    return next(new ErrorHandler("Invalid coupon code", 404));
  }

  const now = new Date();
  if (coupon.validFrom > now || coupon.validUntil < now) {
    return next(new ErrorHandler("Coupon is not valid at this time", 400));
  }

  if (coupon.usageLimit <= 0) {
    return next(new ErrorHandler("Coupon usage limit exceeded", 400));
  }

  // Get user cart
  const cart = await cartModel.findOne({ user: req.user.id }).populate({
    path: "items.product",
    select: "price",
  });
  if (!cart || cart.items.length === 0) {
    return next(new ErrorHandler("Cart is empty", 400));
  }

  // Calculate cart total
  const totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (totalPrice < coupon.minimumOrderAmount) {
    return next(
      new ErrorHandler(
        `Minimum order amount for this coupon is ${coupon.minimumOrderAmount}`,
        400
      )
    );
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (totalPrice * coupon.discountValue) / 100;
  } else {
    discount = coupon.discountValue;
  }

  if (coupon.maximumDiscountAmount && discount > coupon.maximumDiscountAmount) {
    discount = coupon.maximumDiscountAmount;
  }

  // Update cart with discount
  cart.discount = discount;
  cart.totalPriceAfterDiscount = totalPrice - discount;
  cart.coupon = coupon._id;

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Coupon applied successfully",
    cart,
  });
});

module.exports = {
  updateCoupon,
  getAllCoupons,
  getCouponById,
  createCoupon,
  applyCoupon
};
