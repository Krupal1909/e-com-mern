const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product is required"],
        },
        name: {
          type: String,
          required: [true, "Product name is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
        },
        variant: {
          size: String,
          color: String,
        },
        image: {
          public_id: String,
          url: String,
        },
      },
    ],

    shippingAddress: {
      address: { type: String, required: [true, "Address is required"] },
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, required: [true, "State is required"] },
      country: { type: String, required: [true, "Country is required"] },
      pinCode: { type: String, required: [true, "Pin code is required"] },
      phoneNo: { type: String, required: [true, "Phone number is required"] },
    },

    paymentInfo: {
      id: { type: String, required: [true, "Payment ID is required"] },
      status: { type: String, required: [true, "Payment status is required"] },
      method: {
        type: String,
        enum: ["card", "upi", "netbanking", "wallet", "cod"],
        required: [true, "Payment method is required"],
      },
    },

    itemsPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    orderStatus: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled", "Refunded"],
      default: "Processing",
    },

    deliveredAt: Date,
    shippedAt: Date,
    cancelledAt: Date,
    refundedAt: Date,

    paymentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
