const Order = require("../../models/order/order.model");
const Cart = require("../../models/cart/cart.model");
const Product = require("../../models/product/product.model");
const catchAsyncErrors = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utills/ErrorHandler");

// Create new order
const createOrder = catchAsyncErrors(async (req, res, next) => {
  // 🔹 Parse JSON strings first
  if (req.body.orderItems && typeof req.body.orderItems === "string") {
    try {
      req.body.orderItems = JSON.parse(req.body.orderItems);
    } catch (err) {
      return next(new ErrorHandler("Invalid orderItems format", 400));
    }
  }

  if (req.body.shippingAddress && typeof req.body.shippingAddress === "string") {
    try {
      req.body.shippingAddress = JSON.parse(req.body.shippingAddress);
    } catch (err) {
      return next(new ErrorHandler("Invalid shippingAddress format", 400));
    }
  }

  if (req.body.paymentInfo && typeof req.body.paymentInfo === "string") {
    try {
      req.body.paymentInfo = JSON.parse(req.body.paymentInfo);
    } catch (err) {
      return next(new ErrorHandler("Invalid paymentInfo format", 400));
    }
  }

  // 🔹 Now safely destructure
  const {
    orderItems,
    shippingAddress,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return next(new ErrorHandler("No order items found", 400));
  }

  // 🔹 Validate stock
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      return next(new ErrorHandler(`Product not found: ${item.product}`, 404));
    }
    if (product.stock < item.quantity) {
      return next(new ErrorHandler(`Insufficient stock for ${item.name}`, 400));
    }
  }

  // 🔹 Create order
  const order = await Order.create({
    user: req.user.id,
    orderItems,
    shippingAddress,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  // 🔹 Update stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  // 🔹 Clear cart
  await Cart.findOneAndUpdate({ user: req.user.id }, { $set: { items: [] } });

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    order,
  });
});


//getOrder Details

const getOrderDetails = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("orderItems.product", "name images category brand");

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Order details fetched successfully",
    order,
  });
});

//get All orders
const getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query object
  let query = {};

  // Filter by order status if provided
  if (status) {
    query.orderStatus = status;
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  const orders = await Order.find(query)
    .populate("user", "name email")
    .populate("orderItems.product", "name images category brand")
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit));

  const totalOrders = await Order.countDocuments(query);
  const totalPages = Math.ceil(totalOrders / limit);

  res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    orders,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalOrders,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

//update order status

const updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new ErrorHandler("Order status is required", 400));
  }

  const validStatuses = [
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Refunded",
  ];
  if (!validStatuses.includes(status)) {
    return next(new ErrorHandler("Invalid order status", 400));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  // Prevent updating already delivered orders
  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("Cannot update delivered order", 400));
  }

  // Update order status
  order.orderStatus = status;

  // Set appropriate timestamps
  if (status === "Shipped") {
    order.shippedAt = Date.now();
  } else if (status === "Delivered") {
    order.deliveredAt = Date.now();
  } else if (status === "Cancelled") {
    order.cancelledAt = Date.now();

    // Restore product stock when order is cancelled
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
  } else if (status === "Refunded") {
    order.refundedAt = Date.now();

    // Restore product stock when order is refunded
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    order,
  });
});

module.exports = {
  updateOrderStatus,
  getAllOrders,
  getOrderDetails,
  createOrder,
};
