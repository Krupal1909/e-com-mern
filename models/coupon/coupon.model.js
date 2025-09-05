const mongoose = require('mongoose')
;

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxLength: [20, "Coupon code cannot exceed 20 characters"],
    },
    description: {
      type: String,
      required: [true, "Coupon description is required"],
      trim: true,
      maxLength: [200, "Coupon description cannot exceed 200 characters"],
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    maximumDiscountAmount: {
      type: Number,
      min: [0, "Maximum discount amount cannot be negative"],
    },
    usageLimit: {
      type: Number,
      default: null,
      min: [1, "Usage limit must be at least 1"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Used count cannot be negative"],
    },
    validFrom: {
      type: Date,
      required: [true, "Valid from date is required"],
    },
    validUntil: {
      type: Date,
      required: [true, "Valid until date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate that validUntil is after validFrom
couponSchema.pre("save", function (next) {
  if (this.validUntil <= this.validFrom) {
    return next(new Error("Valid until date must be after valid from date"));
  }
  
  if (this.discountType === "percentage" && this.discountValue > 100) {
    return next(new Error("Percentage discount cannot exceed 100%"));
  }
  
  next();
});

// Check if coupon is valid for use
couponSchema.methods.isValidForUse = function () {
  const now = new Date();
  
  if (!this.isActive) {
    return { valid: false, message: "Coupon is not active" };
  }
  
  if (now < this.validFrom) {
    return { valid: false, message: "Coupon is not yet valid" };
  }
  
  if (now > this.validUntil) {
    return { valid: false, message: "Coupon has expired" };
  }
  
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: "Coupon usage limit exceeded" };
  }
  
  return { valid: true, message: "Coupon is valid" };
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function (orderAmount) {
  if (orderAmount < this.minimumOrderAmount) {
    return 0;
  }
  
  let discountAmount = 0;
  
  if (this.discountType === "percentage") {
    discountAmount = (orderAmount * this.discountValue) / 100;
  } else if (this.discountType === "fixed") {
    discountAmount = this.discountValue;
  }
  
  // Apply maximum discount limit if set
  if (this.maximumDiscountAmount && discountAmount > this.maximumDiscountAmount) {
    discountAmount = this.maximumDiscountAmount;
  }
  
  return Math.min(discountAmount, orderAmount);
};

// Create index for efficient queries
couponSchema.index({ code: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ isActive: 1 });

module.exports = mongoose.model("Coupon", couponSchema);
