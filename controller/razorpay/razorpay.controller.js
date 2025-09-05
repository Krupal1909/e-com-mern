const razorpay = require("../../utills/razorpay");
const crypto = require("crypto");

const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "order_rcptid_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign === razorpay_signature) {
      // Save order in DB
      const order = await Order.create({
        user: req.user.id,
        orderItems: req.body.orderItems,
        shippingAddress: req.body.shippingAddress,
        paymentInfo: {
          id: razorpay_payment_id,
          status: "Paid",
          method: "Razorpay",
        },
        itemsPrice: req.body.itemsPrice,
        taxPrice: req.body.taxPrice,
        shippingPrice: req.body.shippingPrice,
        totalPrice: req.body.totalPrice,
      });

      res.status(200).json({ success: true, order });
    } else {
      return next(new ErrorHandler("Payment verification failed", 400));
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  verifyPayment,
  createRazorpayOrder,
};
