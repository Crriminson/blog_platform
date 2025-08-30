const express = require('express');
const { body } = require('express-validator');
const {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  toggleLikeBlog
} = require('../controllers/blogController');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/blogs
// @desc    Create new blog
// @access  Private
router.post('/', [
  auth,
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10-200 characters'),
  body('content')
    .trim()
    .isLength({ min: 100 })
    .withMessage('Content must be at least 100 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed')
], createBlog);

// @route   GET /api/blogs
// @desc    Get all blogs with filters
// @access  Public
router.get('/', optionalAuth, getAllBlogs);

// @route   GET /api/blogs/:id
// @desc    Get single blog by ID
// @access  Public
router.get('/:id', optionalAuth, getBlogById);

// @route   PUT /api/blogs/:id
// @desc    Update blog
// @access  Private (own blogs only)
router.put('/:id', [
  auth,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10-200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 100 })
    .withMessage('Content must be at least 100 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed')
], updateBlog);

// @route   DELETE /api/blogs/:id
// @desc    Delete blog
// @access  Private (own blogs only)
router.delete('/:id', auth, deleteBlog);

// @route   POST /api/blogs/:id/like
// @desc    Toggle like on blog
// @access  Private
router.post('/:id/like', auth, toggleLikeBlog);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Blog routes working',
    route: '/api/blogs/test',
    availableEndpoints: [
      'POST /api/blogs',
      'GET /api/blogs',
      'GET /api/blogs/:id',
      'PUT /api/blogs/:id',
      'DELETE /api/blogs/:id',
      'POST /api/blogs/:id/like'
    ]
  });
});

module.exports = router;