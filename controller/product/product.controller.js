const Product = require("../../models/product/product.model");
const catchAsyncErrors = require("../../middleware/catchAsyncError");
const ErrorHandler = require("../../utills/ErrorHandler");
const cloudinary = require("../../utills/cloudinary");
// Get all products with filtering, sorting, and pagination
const getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const {
    keyword,
    category,
    brand,
    minPrice,
    maxPrice,
    ratings,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query object
  let query = { isActive: true };

  // Search by keyword
  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { category: { $regex: keyword, $options: "i" } },
    ];
  }

  // Filter by category
  if (category) {
    query.category = { $regex: category, $options: "i" };
  }

  // Filter by brand
  if (brand) {
    query.brand = { $regex: brand, $options: "i" };
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Filter by ratings
  if (ratings) {
    query.ratings = { $gte: Number(ratings) };
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  const products = await Product.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .populate("createdBy", "name");

  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limit);

  res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    products,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalProducts,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

// Get single product by ID
const getProductById = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("reviews.user", "name avatar");

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    product,
  });
});

const addProduct = catchAsyncErrors(async (req, res, next) => {
  let { name, description, price, category, brand, stock, variants, tags } =
    req.body;

  if (!req.files || req.files.length === 0) {
    return next(new ErrorHandler("At least one image is required", 400));
  }

  let images = [];

  if (variants && typeof variants === "string") {
    try {
      variants = JSON.parse(variants);
    } catch (error) {
      return next(new ErrorHandler("Invalid variants format", 400));
    }
  }
  if (tags && typeof tags === "string") {
    try {
      tags = JSON.parse(tags);
    } catch (error) {
      return next(new ErrorHandler("Invalid tags format", 400));
    }
  }
  // Upload all images to Cloudinary
  for (const file of req.files) {
    const cloudinaryResponse = await cloudinary.uploader.upload(file.path, {
      folder: "products",
    });

    images.push({
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    });
  }

  const product = await Product.create({
    name,
    description,
    price,
    category,
    brand,
    stock,
    images,
    variants,
    tags,
    createdBy: req.user._id, // from auth middleware
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

//update Product
const updateProduct = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Find the product
  let product = await Product.findById(id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Authorization check
  if (
    req.user.role !== "admin" &&
    product.createdBy.toString() !== req.user._id.toString()
  ) {
    return next(new ErrorHandler("Unauthorized to update this product", 403));
  }

  let { name, description, price, category, brand, stock, variants, tags, discountPrice } =
    req.body;

  // Parse variants if string
  if (variants && typeof variants === "string") {
    try {
      variants = JSON.parse(variants);
    } catch (error) {
      return next(new ErrorHandler("Invalid variants format", 400));
    }
  }

  // Parse tags if string
  if (tags && typeof tags === "string") {
    try {
      tags = JSON.parse(tags);
    } catch (error) {
      return next(new ErrorHandler("Invalid tags format", 400));
    }
  }

  // Prepare images array
  let images = [];

  if (req.files && req.files.length > 0) {
    // Upload new images to Cloudinary
    for (const file of req.files) {
      const cloudinaryResponse = await cloudinary.uploader.upload(file.path, {
        folder: "products",
      });

      images.push({
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      });
    }

    // Delete old images if not keeping them
    if (req.body.keepExistingImages !== "true" && product.images.length > 0) {
      for (const image of product.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    // Merge if keeping old images
    if (req.body.keepExistingImages === "true" && product.images.length > 0) {
      images = [...product.images, ...images];
    }
  } else {
    // If no new files, keep existing images
    images = product.images;
  }

  // Update product fields
  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.category = category || product.category;
  product.brand = brand || product.brand;
  product.stock = stock || product.stock;
  product.discountPrice = discountPrice || product.discountPrice;
  product.variants = variants || product.variants;
  product.tags = tags || product.tags;
  product.images = images;

  // Save updated product
  const updatedProduct = await product.save();

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: updatedProduct,
  });
});


const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const { hardDelete = false } = req.query;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  if (
    req.user.role !== "admin" &&
    product.createdBy.toString() !== req.user._id.toString()
  ) {
    return next(new ErrorHandler("Unauthorized to delete this product", 403));
  }

  if (hardDelete) {
    await product.deleteOne();
  } else {
    product.isActive = false;
    await product.save();
  }

  res.status(200).json({
    success: true,
    message: hardDelete
      ? "Product permanently deleted"
      : "Product soft deleted",
  });
});

module.exports = {
  deleteProduct,
  updateProduct,
  addProduct,
  getAllProducts,
  getProductById,
};
