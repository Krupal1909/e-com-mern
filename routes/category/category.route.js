const 
express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../../controller/category/category.controller");
const isAuthenticated = require("../../middleware/auth.middleware");

// Get all categories
router.get("/", getAllCategories);

// Get single category by ID
router.get("/:id", getCategoryById);

// Create new category (admin only)
router.post("/", isAuthenticated, createCategory);

// Update category (admin/creator only)
router.put("/:id", isAuthenticated, updateCategory);

// Delete category (admin/creator only)
router.delete("/:id", isAuthenticated, deleteCategory);

module.exports = router;
