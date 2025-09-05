const User = require('../../models/auth/user.model');
const catchAsyncErrors = require('../../middleware/catchAsyncError');
const ErrorHandler = require('../../utills/ErrorHandler');
const Order = require('../../models/order/order.model');

// Get user profile
const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      wishlist: user.wishlist,
      createdAt: user.createdAt,
    },
  });
});

// Update user profile
const updateUserProfile = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const updateData = {
    name,
    email,
    password, 
    role
  };

  // Check if email is being changed and if it already exists
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler("Email already exists", 400));
    }
  }

  // Handle avatar upload if file exists
  if (req.file) {
    // Delete old avatar file if exists
    if (req.user.avatar && req.user.avatar.url) {
      const oldPath = path.join(__dirname, "..", "..", req.user.avatar.url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Set new avatar path
    updateData.avatar = {
      public_id: "", // not needed for local storage
      url: req.file.path, // saved local path
    };
  }

  // Update user
  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      password : user.password
    },
  });
});

// Update user password
const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler('Please provide old and new password', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  const isPasswordMatched = await user.comparePassword(oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Old password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});


const getUsersOrder = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id });

  if (!orders || orders.length === 0) {
    return next(new ErrorHandler("No orders found for this user", 404));
  }

  res.status(200).json({
    success: true,
    message: "User order details fetched successfully",
    orders,
  });
});

const getUserOrderById = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });

  if (!order) {
    return next(new ErrorHandler("Order not found or not authorized", 404));
  }

  res.status(200).json({
    success: true,
    message: "Order details fetched successfully",
    order,
  });
});


module.exports = {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getUsersOrder,
  getUserOrderById
};
