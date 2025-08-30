const { validationResult } = require('express-validator');
const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

// @desc    Approve a blog post
// @route   PUT /api/admin/blogs/:id/approve
// @access  Private/Admin
const approveBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const blog = await Blog.findById(id).populate('author', 'firstName lastName email');
    
    if (!blog) {
      return res.status(404).json({
        message: 'Blog not found'
      });
    }

    if (blog.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending blogs can be approved'
      });
    }

    blog.status = 'approved';
    blog.publishedAt = new Date();
    blog.adminNotes = adminNotes || '';
    
    await blog.save();

    res.json({
      message: 'Blog approved successfully',
      blog: {
        id: blog._id,
        title: blog.title,
        author: blog.author,
        status: blog.status,
        publishedAt: blog.publishedAt,
        adminNotes: blog.adminNotes
      }
    });

  } catch (error) {
    console.error('Approve blog error:', error);
    res.status(500).json({
      message: 'Server error while approving blog'
    });
  }
};

// @desc    Reject a blog post
// @route   PUT /api/admin/blogs/:id/reject
// @access  Private/Admin
const rejectBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        message: 'Rejection reason is required'
      });
    }

    const blog = await Blog.findById(id).populate('author', 'firstName lastName email');
    
    if (!blog) {
      return res.status(404).json({
        message: 'Blog not found'
      });
    }

    if (blog.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending blogs can be rejected'
      });
    }

    blog.status = 'rejected';
    blog.rejectionReason = rejectionReason;
    blog.adminNotes = adminNotes || '';
    
    await blog.save();

    res.json({
      message: 'Blog rejected successfully',
      blog: {
        id: blog._id,
        title: blog.title,
        author: blog.author,
        status: blog.status,
        rejectionReason: blog.rejectionReason,
        adminNotes: blog.adminNotes
      }
    });

  } catch (error) {
    console.error('Reject blog error:', error);
    res.status(500).json({
      message: 'Server error while rejecting blog'
    });
  }
};

// @desc    Get all pending blogs for review
// @route   GET /api/admin/blogs/pending
// @access  Private/Admin
const getPendingBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find({ status: 'pending' })
      .populate('author', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalPending = await Blog.countDocuments({ status: 'pending' });

    res.json({
      message: 'Pending blogs retrieved successfully',
      blogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPending / limit),
        totalBlogs: totalPending,
        hasNext: page < Math.ceil(totalPending / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get pending blogs error:', error);
    res.status(500).json({
      message: 'Server error while fetching pending blogs'
    });
  }
};

// @desc    Get all users for admin management
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status; // 'active', 'inactive', or undefined for all

    // Build search query
    let query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const users = await User.find(query)
      .populate('blogCount')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalUsers = await User.countDocuments(query);

    res.json({
      message: 'Users retrieved successfully',
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: page < Math.ceil(totalUsers / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      message: 'Server error while fetching users'
    });
  }
};

// @desc    Toggle user active status (activate/deactivate)
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Cannot modify your own account status'
      });
    }

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Prevent deactivating other admins
    if (user.role === 'admin' && user.isActive) {
      return res.status(400).json({
        message: 'Cannot deactivate other admin accounts'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      message: 'Server error while updating user status'
    });
  }
};

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getDashboardAnalytics = async (req, res) => {
  try {
    // Get basic counts
    const [
      totalUsers,
      activeUsers,
      totalBlogs,
      publishedBlogs,
      pendingBlogs,
      rejectedBlogs,
      totalComments,
      activeComments
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'approved' }),
      Blog.countDocuments({ status: 'pending' }),
      Blog.countDocuments({ status: 'rejected' }),
      Comment.countDocuments(),
      Comment.countDocuments({ isActive: true })
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [
      newUsersWeek,
      newBlogsWeek,
      newCommentsWeek
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Blog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Comment.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);

    // Get top authors by blog count
    const topAuthors = await Blog.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$author', blogCount: { $sum: 1 } } },
      { $sort: { blogCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $project: {
          _id: 1,
          blogCount: 1,
          'author.firstName': 1,
          'author.lastName': 1,
          'author.email': 1
        }
      }
    ]);

    // Get most liked blogs
    const popularBlogs = await Blog.find({ status: 'approved' })
      .populate('author', 'firstName lastName')
      .sort({ likesCount: -1, views: -1 })
      .limit(5)
      .select('title author likesCount views createdAt');

    res.json({
      message: 'Dashboard analytics retrieved successfully',
      analytics: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          totalBlogs,
          publishedBlogs,
          pendingBlogs,
          rejectedBlogs,
          draftBlogs: totalBlogs - publishedBlogs - pendingBlogs - rejectedBlogs,
          totalComments,
          activeComments,
          deletedComments: totalComments - activeComments
        },
        recentActivity: {
          newUsersWeek,
          newBlogsWeek,
          newCommentsWeek
        },
        topAuthors,
        popularBlogs
      }
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      message: 'Server error while fetching analytics'
    });
  }
};

module.exports = {
  approveBlog,
  rejectBlog,
  getPendingBlogs,
  getAllUsers,
  toggleUserStatus,
  getDashboardAnalytics
};
