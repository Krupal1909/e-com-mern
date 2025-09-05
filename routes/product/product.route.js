const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
} = require("../../controller/product/product.controller");
const isAuthenticated = require("../../middleware/auth.middleware");
const upload = require("../../middleware/multer.middleware");

// Get all products with filtering and pagination
router.get("/", getAllProducts);

// Get single product by ID
router.get("/:id", getProductById);

// Add new product (admin/seller only)
router.post("/",upload.array("images", 5), isAuthenticated, addProduct);

// Update product (admin/seller only)
router.put("/:id",upload.array("image"), isAuthenticated, updateProduct);

// Delete product (admin/seller only)
router.delete("/:id", isAuthenticated, deleteProduct);

module.exports = router;
