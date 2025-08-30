const express = require('express');
const { body } = require('express-validator');
const {
  addComment,
  getBlogComments,
  updateComment,
  deleteComment,
  reportComment
} = require('../controllers/commentController');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/comments
// @desc    Add comment to blog
// @access  Private
router.post('/', [
  auth,
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1-500 characters'),
  body('blogId')
    .isMongoId()
    .withMessage('Valid blog ID is required'),
  body('parentCommentId')
    .optional()
    .isMongoId()
    .withMessage('Valid parent comment ID required')
], addComment);

// @route   GET /api/comments/blog/:blogId
// @desc    Get comments for a blog
// @access  Public
router.get('/blog/:blogId', getBlogComments);

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private (own comments only)
router.put('/:id', [
  auth,
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1-500 characters')
], updateComment);

// @route   DELETE /api/comments/:id
// @desc    Delete comment (soft delete)
// @access  Private (own comments only)
router.delete('/:id', auth, deleteComment);

// @route   POST /api/comments/:id/report
// @desc    Report comment
// @access  Private
router.post('/:id/report', auth, reportComment);

module.exports = router;
