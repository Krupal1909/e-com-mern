const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_RDosKNRNFkLmEA",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "L0Se6E26djmL2rQi4MQTOqzo",
});

module.exports = razorpay;
