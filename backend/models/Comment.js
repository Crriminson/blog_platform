const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    minlength: [1, 'Comment cannot be empty']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment author is required'],
    index: true
  },
  blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: [true, 'Blog reference is required'],
    index: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  // For nested replies tracking
  depth: {
    type: Number,
    default: 0,
    max: [3, 'Maximum reply depth is 3 levels']
  },
  // For moderation
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isReported: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
commentSchema.index({ blog: 1, isActive: 1, createdAt: -1 }); // Blog comments
commentSchema.index({ author: 1, isActive: 1 }); // User's comments
commentSchema.index({ parentComment: 1, isActive: 1 }); // Replies to comments
commentSchema.index({ blog: 1, parentComment: 1, isActive: 1 }); // Top-level comments

// Virtual for replies count
commentSchema.virtual('repliesCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true,
  match: { isActive: true }
});

// Pre-save middleware to set depth for nested replies
commentSchema.pre('save', async function(next) {
  if (this.parentComment && this.isNew) {
    try {
      const parentComment = await this.constructor.findById(this.parentComment);
      if (parentComment) {
        this.depth = parentComment.depth + 1;
        if (this.depth > 3) {
          return next(new Error('Maximum reply depth exceeded'));
        }
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Post-save middleware to update blog's last activity
commentSchema.post('save', async function() {
  try {
    if (this.isActive) {
      await mongoose.model('Blog').findByIdAndUpdate(
        this.blog,
        { lastActivity: new Date() }
      );
    }
  } catch (error) {
    console.error('Error updating blog last activity:', error);
  }
});

// Post-remove middleware to update blog's last activity
commentSchema.post('remove', async function() {
  try {
    await mongoose.model('Blog').findByIdAndUpdate(
      this.blog,
      { lastActivity: new Date() }
    );
  } catch (error) {
    console.error('Error updating blog last activity:', error);
  }
});

// Instance method to soft delete comment
commentSchema.methods.softDelete = async function() {
  this.isActive = false;
  return await this.save();
};

// Instance method to report comment
commentSchema.methods.reportComment = async function(userId, reason) {
  const existingReport = this.reportedBy.find(
    report => report.user.toString() === userId.toString()
  );
  
  if (existingReport) {
    throw new Error('You have already reported this comment');
  }
  
  this.reportedBy.push({
    user: userId,
    reason: reason || 'Inappropriate content'
  });
  
  this.isReported = true;
  return await this.save();
};

// Static method to get comments for a blog
commentSchema.statics.getBlogComments = function(blogId, limit = 20, skip = 0) {
  return this.find({ 
    blog: blogId, 
    isActive: true,
    parentComment: null // Only top-level comments
  })
  .populate('author', 'firstName lastName profilePicture')
  .populate({
    path: 'parentComment',
    populate: {
      path: 'author',
      select: 'firstName lastName'
    }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to get comment replies
commentSchema.statics.getCommentReplies = function(commentId) {
  return this.find({ 
    parentComment: commentId, 
    isActive: true 
  })
  .populate('author', 'firstName lastName profilePicture')
  .sort({ createdAt: 1 }); // Replies in chronological order
};

// Static method to get reported comments (for admin)
commentSchema.statics.getReportedComments = function() {
  return this.find({ isReported: true, isActive: true })
    .populate('author', 'firstName lastName email')
    .populate('blog', 'title')
    .sort({ updatedAt: -1 });
};

// Static method to get user's comments
commentSchema.statics.getUserComments = function(userId, limit = 10, skip = 0) {
  return this.find({ author: userId, isActive: true })
    .populate('blog', 'title status')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('Comment', commentSchema);