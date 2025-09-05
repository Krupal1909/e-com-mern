const jwt = require("jsonwebtoken");
const catchAsyncError = require("../middleware/catchAsyncError");
const userModel = require("../models/auth/user.model");

const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated, please sign-in",
    });
  }
  const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
  if(!decode){
          return res.status(400).json({
                    success : false,
                    message : "token verification failed"
          })
  }
  const user = await userModel.findById(decode.id);
  req.user = user;
  next()
});

module.exports = isAuthenticated;