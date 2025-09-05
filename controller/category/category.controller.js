const 
Category = require("../../models/category/category.model");
const catchAsyncErrors = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utills/ErrorHandler");

// Get all categories
const getAllCategories = catchAsyncErrors(async (req, res, next) => {
  const categories = await Category.find().populate("createdBy", "name");

  res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    categories,
  });
});

// Get single category by ID
const getCategoryById = catchAsyncErrors(async (req, res, next) => {
  const category = await Category.findById(req.params.id).populate("createdBy", "name email");

  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Category fetched successfully",
    category,
  });
});

// Create new category
const createCategory = catchAsyncErrors(async (req, res, next) => {
  const { name, description } = req.body;

  // Check if category already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return next(new ErrorHandler("Category already exists", 400));
  }

  const category = await Category.create({
    name,
    description,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    category,
  });
});

// Update category
const updateCategory = catchAsyncErrors(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  // Check if user is authorized to update
  if (
    req.user.role !== "admin" &&
    category.createdBy.toString() !== req.user._id.toString()
  ) {
    return next(new ErrorHandler("Unauthorized to update this category", 403));
  }

  const { name, description } = req.body;

  // Check if new name already exists (excluding current category)
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return next(new ErrorHandler("Category name already exists", 400));
    }
  }

  category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, description },
    {
      new: true,
      runValidators: true,
    }
  ).populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category,
  });
});

// Delete category
const deleteCategory = catchAsyncErrors(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  // Check if user is authorized to delete
  if (
    req.user.role !== "admin" &&
    category.createdBy.toString() !== req.user._id.toString()
  ) {
    return next(new ErrorHandler("Unauthorized to delete this category", 403));
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
