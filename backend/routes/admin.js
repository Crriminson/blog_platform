const express = require('express');
const { body } = require('express-validator');
const {
  approveBlog,
  rejectBlog,
  getPendingBlogs,
  getAllUsers,
  toggleUserStatus,
  getDashboardAnalytics
} = require('../controllers/adminController');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuth);

// @route   PUT /api/admin/blogs/:id/approve
// @desc    Approve a blog post
// @access  Private/Admin
router.put('/blogs/:id/approve', [
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters')
], approveBlog);

// @route   PUT /api/admin/blogs/:id/reject
// @desc    Reject a blog post
// @access  Private/Admin
router.put('/blogs/:id/reject', [
  body('rejectionReason')
    .notEmpty()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10-500 characters'),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters')
], rejectBlog);

// @route   GET /api/admin/blogs/pending
// @desc    Get all pending blogs for review
// @access  Private/Admin
router.get('/blogs/pending', getPendingBlogs);

// @route   GET /api/admin/users
// @desc    Get all users for admin management
// @access  Private/Admin
router.get('/users', getAllUsers);

// @route   PUT /api/admin/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private/Admin
router.put('/users/:id/toggle-status', toggleUserStatus);

// @route   GET /api/admin/analytics
// @desc    Get dashboard analytics
// @access  Private/Admin
router.get('/analytics', getDashboardAnalytics);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Admin routes working',
    route: '/api/admin/test',
    adminUser: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    },
    availableEndpoints: [
      'PUT /api/admin/blogs/:id/approve',
      'PUT /api/admin/blogs/:id/reject',
      'GET /api/admin/blogs/pending',
      'GET /api/admin/users',
      'PUT /api/admin/users/:id/toggle-status',
      'GET /api/admin/analytics'
    ]
  });
});

module.exports = router;