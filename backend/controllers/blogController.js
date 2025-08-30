const { validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const User = require('../models/User');

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private
const createBlog = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, content, category, tags } = req.body;

    // Create new blog
    const blog = new Blog({
      title,
      content,
      author: req.user._id,
      category: category || '',
      tags: tags || [],
      status: 'pending' // All new blogs start as pending for admin approval
    });

    await blog.save();

    // Populate author info for response
    await blog.populate('author', 'firstName lastName email');

    res.status(201).json({
      message: 'Blog created successfully and submitted for review',
      blog: {
        id: blog._id,
        title: blog.title,
        content: blog.content,
        author: blog.author,
        category: blog.category,
        tags: blog.tags,
        status: blog.status,
        createdAt: blog.createdAt
      }
    });

  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      message: 'Server error while creating blog',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all blogs with filters
// @route   GET /api/blogs
// @access  Public
const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'approved'; // Default to published blogs
    const category = req.query.category;
    const search = req.query.search;
    const author = req.query.author;

    // Build query
    let query = {};
    
    // Status filter (only show approved blogs to public, all statuses to logged-in users viewing their own)
    if (req.user && req.user.role === 'admin') {
      // Admin can see all blogs
      if (status) query.status = status;
    } else if (req.user && author === req.user._id.toString()) {
      // Users can see their own blogs in any status
      query.author = req.user._id;
      if (status && status !== 'approved') query.status = status;
    } else {
      // Public can only see approved blogs
      query.status = 'approved';
    }

    // Additional filters
    if (category) query.category = category;
    if (author && (!req.user || author !== req.user._id.toString())) {
      query.author = author;
      query.status = 'approved'; // Non-owners can only see approved blogs
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const blogs = await Blog.find(query)
      .populate('author', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-content'); // Exclude content for list view

    const totalBlogs = await Blog.countDocuments(query);

    res.json({
      message: 'Blogs retrieved successfully',
      blogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalBlogs / limit),
        totalBlogs,
        hasNext: page < Math.ceil(totalBlogs / limit),
        hasPrev: page > 1
      },
      filters: {
        status: query.status,
        category,
        search,
        author
      }
    });

  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({
      message: 'Server error while fetching blogs'
    });
  }
};

// @desc    Get single blog by ID
// @route   GET /api/blogs/:id
// @access  Public
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id)
      .populate('author', 'firstName lastName profilePicture email createdAt')
      .populate({
        path: 'author',
        populate: {
          path: 'blogCount'
        }
      });

    if (!blog) {
      return res.status(404).json({
        message: 'Blog not found'
      });
    }

    // Check if user can view this blog
    const canView = 
      blog.status === 'approved' || // Anyone can view approved blogs
      (req.user && req.user._id.toString() === blog.author._id.toString()) || // Author can view own blogs
      (req.user && req.user.role === 'admin'); // Admin can view any blog

    if (!canView) {
      return res.status(403).json({
        message: 'Blog not available for viewing'
      });
    }

    // Increment view count only for approved blogs and if not the author
    if (blog.status === 'approved' && (!req.user || req.user._id.toString() !== blog.author._id.toString())) {
      blog.views += 1;
      await blog.save();
    }

    // Check if current user has liked this blog
    let hasLiked = false;
    if (req.user) {
      hasLiked = blog.likes.includes(req.user._id);
    }

    res.json({
      message: 'Blog retrieved successfully',
      blog: {
        id: blog._id,
        title: blog.title,
        content: blog.content,
        author: {
          id: blog.author._id,
          firstName: blog.author.firstName,
          lastName: blog.author.lastName,
          fullName: blog.author.fullName,
          profilePicture: blog.author.profilePicture,
          email: blog.author.email,
          memberSince: blog.author.createdAt,
          blogCount: blog.author.blogCount
        },
        category: blog.category,
        tags: blog.tags,
        status: blog.status,
        likesCount: blog.likesCount,
        views: blog.views,
        hasLiked,
        featuredImage: blog.featuredImage,
        publishedAt: blog.publishedAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        // Only show admin fields to admin or author
        ...(req.user && (req.user.role === 'admin' || req.user._id.toString() === blog.author._id.toString()) && {
          rejectionReason: blog.rejectionReason,
          adminNotes: blog.adminNotes
        })
      }
    });

  } catch (error) {
    console.error('Get blog by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid blog ID format'
      });
    }
    res.status(500).json({
      message: 'Server error while fetching blog'
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (own blogs only)
const updateBlog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, content, category, tags } = req.body;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        message: 'Blog not found'
      });
    }

    // Check if user owns this blog or is admin
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Not authorized to update this blog'
      });
    }

    // Only allow updates to draft or rejected blogs (not pending or approved)
    if (blog.status === 'pending') {
      return res.status(400).json({
        message: 'Cannot update blog while under review'
      });
    }

    if (blog.status === 'approved' && req.user.role !== 'admin') {
      return res.status(400).json({
        message: 'Cannot update published blog. Contact admin if changes are needed.'
      });
    }

    // Update fields
    if (title) blog.title = title;
    if (content) blog.content = content;
    if (category !== undefined) blog.category = category;
    if (tags !== undefined) blog.tags = tags;

    // Reset status to draft if it was rejected and user is making changes
    if (blog.status === 'rejected' && req.user.role !== 'admin') {
      blog.status = 'draft';
      blog.rejectionReason = '';
      blog.adminNotes = '';
    }

    await blog.save();
    await blog.populate('author', 'firstName lastName email');

    res.json({
      message: 'Blog updated successfully',
      blog: {
        id: blog._id,
        title: blog.title,
        content: blog.content,
        author: blog.author,
        category: blog.category,
        tags: blog.tags,
        status: blog.status,
        updatedAt: blog.updatedAt
      }
    });

  } catch (error) {
    console.error('Update blog error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid blog ID format'
      });
    }
    res.status(500).json({
      message: 'Server error while updating blog'
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (own blogs only)
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        message: 'Blog not found'
      });
    }

    // Check if user owns this blog or is admin
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Not authorized to delete this blog'
      });
    }

    // Only allow deletion of draft, rejected blogs, or admin can delete any
    if (blog.status === 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({
        message: 'Cannot delete blog while under review. Contact admin if needed.'
      });
    }

    if (blog.status === 'approved' && req.user.role !== 'admin') {
      return res.status(400).json({
        message: 'Cannot delete published blog. Contact admin to remove published content.'
      });
    }

    // Delete the blog
    await Blog.findByIdAndDelete(id);

    // Also delete associated comments
    const Comment = require('../models/Comment');
    await Comment.deleteMany({ blog: id });

    res.json({
      message: 'Blog deleted successfully',
      deletedBlog: {
        id: blog._id,
        title: blog.title,
        status: blog.status
      }
    });

  } catch (error) {
    console.error('Delete blog error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid blog ID format'
      });
    }
    res.status(500).json({
      message: 'Server error while deleting blog'
    });
  }
};

// @desc    Toggle like on blog
// @route   POST /api/blogs/:id/like
// @access  Private
const toggleLikeBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        message: 'Blog not found'
      });
    }

    // Only approved blogs can be liked
    if (blog.status !== 'approved') {
      return res.status(400).json({
        message: 'Only published blogs can be liked'
      });
    }

    // Users cannot like their own blogs
    if (blog.author.toString() === userId.toString()) {
      return res.status(400).json({
        message: 'Cannot like your own blog'
      });
    }

    const hasLiked = blog.likes.includes(userId);

    if (hasLiked) {
      // Unlike: remove user from likes array
      blog.likes = blog.likes.filter(like => like.toString() !== userId.toString());
      blog.likesCount = Math.max(0, blog.likesCount - 1);
    } else {
      // Like: add user to likes array
      blog.likes.push(userId);
      blog.likesCount += 1;
    }

    // Update last activity for trending algorithm
    blog.lastActivity = new Date();
    
    // Simple trending score calculation (likes + views with time decay)
    const daysSinceCreation = (Date.now() - blog.createdAt) / (1000 * 60 * 60 * 24);
    const timeDecay = Math.max(0.1, 1 / (1 + daysSinceCreation * 0.1));
    blog.trendingScore = (blog.likesCount * 2 + blog.views) * timeDecay;

    await blog.save();

    res.json({
      message: hasLiked ? 'Blog unliked successfully' : 'Blog liked successfully',
      blog: {
        id: blog._id,
        title: blog.title,
        likesCount: blog.likesCount,
        hasLiked: !hasLiked,
        trendingScore: blog.trendingScore
      }
    });

  } catch (error) {
    console.error('Toggle like blog error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid blog ID format'
      });
    }
    res.status(500).json({
      message: 'Server error while toggling like'
    });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  toggleLikeBlog
};
