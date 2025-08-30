const { body, validationResult } = require('express-validator');

// Common validation rules
const validators = {
  // Email validation
  email: () => 
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),

  // Password validation
  password: (minLength = 6) => 
    body('password')
      .isLength({ min: minLength })
      .withMessage(`Password must be at least ${minLength} characters long`),

  // Name validation
  name: (field, minLength = 2, maxLength = 50) =>
    body(field)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} must be between ${minLength}-${maxLength} characters`),

  // Blog title validation
  blogTitle: () =>
    body('title')
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Title must be between 10-200 characters'),

  // Blog content validation
  blogContent: () =>
    body('content')
      .trim()
      .isLength({ min: 100 })
      .withMessage('Content must be at least 100 characters'),

  // Category validation
  category: () =>
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Category cannot exceed 50 characters'),

  // Tags validation
  tags: () =>
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Maximum 10 tags allowed'),

  // Comment validation
  comment: () =>
    body('content')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Comment must be between 1-500 characters'),

  // MongoDB ID validation
  mongoId: (field) =>
    body(field)
      .isMongoId()
      .withMessage(`Valid ${field} is required`),

  // URL validation
  url: (field) =>
    body(field)
      .optional()
      .isURL()
      .withMessage(`${field} must be a valid URL`)
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Common validation chains
const validationChains = {
  // User registration
  userRegister: [
    validators.email(),
    validators.password(6),
    validators.name('firstName'),
    validators.name('lastName')
  ],

  // User login
  userLogin: [
    validators.email(),
    body('password').notEmpty().withMessage('Password is required')
  ],

  // Blog creation
  blogCreate: [
    validators.blogTitle(),
    validators.blogContent(),
    validators.category(),
    validators.tags()
  ],

  // Blog update
  blogUpdate: [
    validators.blogTitle(),
    validators.blogContent(),
    validators.category(),
    validators.tags()
  ],

  // Comment creation
  commentCreate: [
    validators.comment(),
    validators.mongoId('blogId'),
    body('parentCommentId').optional().isMongoId().withMessage('Valid parent comment ID required')
  ],

  // Profile update
  profileUpdate: [
    validators.name('firstName').optional(),
    validators.name('lastName').optional(),
    validators.url('profilePicture')
  ]
};

// Sanitization helpers
const sanitize = {
  // Remove HTML tags
  stripHtml: (text) => {
    return text.replace(/<[^>]*>/g, '');
  },

  // Escape special characters
  escapeHtml: (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  },

  // Clean and format text
  cleanText: (text) => {
    return text.trim().replace(/\s+/g, ' ');
  }
};

module.exports = {
  validators,
  validationChains,
  handleValidationErrors,
  sanitize
};
