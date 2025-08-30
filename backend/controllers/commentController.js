const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Blog = require('../models/Blog');

// @desc    Add comment to blog
// @route   POST /api/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, blogId, parentCommentId } = req.body;

    // Check if blog exists and is published
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        message: 'Blog not found'
      });
    }

    if (blog.status !== 'approved') {
      return res.status(400).json({
        message: 'Comments can only be added to published blogs'
      });
    }

    // If replying to a comment, check if parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment || parentComment.blog.toString() !== blogId) {
        return res.status(404).json({
          message: 'Parent comment not found'
        });
      }
    }

    // Create new comment
    const comment = new Comment({
      content,
      author: req.user._id,
      blog: blogId,
      parentComment: parentCommentId || null
    });

    await comment.save();
    await comment.populate('author', 'firstName lastName profilePicture');

    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        id: comment._id,
        content: comment.content,
        author: comment.author,
        blog: comment.blog,
        parentComment: comment.parentComment,
        depth: comment.depth,
        createdAt: comment.createdAt
      }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      message: 'Server error while adding comment'
    });
  }
};

// @desc    Get comments for a blog
// @route   GET /api/comments/blog/:blogId
// @access  Public
const getBlogComments = async (req, res) => {
  try {
    const { blogId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog || blog.status !== 'approved') {
      return res.status(404).json({
        message: 'Blog not found or not published'
      });
    }

    const comments = await Comment.getBlogComments(blogId, limit, (page - 1) * limit);
    const totalComments = await Comment.countDocuments({ 
      blog: blogId, 
      isActive: true,
      parentComment: null 
    });

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.getCommentReplies(comment._id);
        return {
          ...comment.toObject(),
          replies: replies.map(reply => ({
            id: reply._id,
            content: reply.content,
            author: reply.author,
            depth: reply.depth,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt
          }))
        };
      })
    );

    res.json({
      message: 'Comments retrieved successfully',
      comments: commentsWithReplies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
        hasNext: page < Math.ceil(totalComments / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get blog comments error:', error);
    res.status(500).json({
      message: 'Server error while fetching comments'
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private (own comments only)
const updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(id);

    if (!comment || !comment.isActive) {
      return res.status(404).json({
        message: 'Comment not found'
      });
    }

    // Check if user owns this comment or is admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Not authorized to update this comment'
      });
    }

    comment.content = content;
    await comment.save();
    await comment.populate('author', 'firstName lastName profilePicture');

    res.json({
      message: 'Comment updated successfully',
      comment: {
        id: comment._id,
        content: comment.content,
        author: comment.author,
        updatedAt: comment.updatedAt
      }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      message: 'Server error while updating comment'
    });
  }
};

// @desc    Delete comment (soft delete)
// @route   DELETE /api/comments/:id
// @access  Private (own comments only)
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment || !comment.isActive) {
      return res.status(404).json({
        message: 'Comment not found'
      });
    }

    // Check if user owns this comment or is admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete
    comment.isActive = false;
    await comment.save();

    res.json({
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      message: 'Server error while deleting comment'
    });
  }
};

// @desc    Report comment
// @route   POST /api/comments/:id/report
// @access  Private
const reportComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment || !comment.isActive) {
      return res.status(404).json({
        message: 'Comment not found'
      });
    }

    // Users cannot report their own comments
    if (comment.author.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Cannot report your own comment'
      });
    }

    comment.isReported = true;
    await comment.save();

    res.json({
      message: 'Comment reported successfully'
    });

  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({
      message: 'Server error while reporting comment'
    });
  }
};

module.exports = {
  addComment,
  getBlogComments,
  updateComment,
  deleteComment,
  reportComment
};
