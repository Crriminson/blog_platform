const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    minlength: [10, 'Title must be at least 10 characters']
  },
  content: {
    type: String,
    required: [true, 'Blog content is required'],
    minlength: [100, 'Content must be at least 100 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'pending', 'approved', 'rejected', 'hidden'],
      message: 'Status must be one of: draft, pending, approved, rejected, hidden'
    },
    default: 'draft',
    index: true
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
    index: true
  },
  tags: {
    type: [String],
    validate: {
      validator: function(tags) {
        return tags.length <= 10; // Max 10 tags
      },
      message: 'Cannot have more than 10 tags'
    },
    index: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  featuredImage: {
    type: String,
    validate: {
      validator: function(url) {
        if (!url) return true; // Optional field
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      },
      message: 'Featured image must be a valid image URL'
    }
  },
  publishedAt: {
    type: Date,
    index: true
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  // For trending algorithm
  trendingScore: {
    type: Number,
    default: 0,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance optimization
blogSchema.index({ status: 1, publishedAt: -1 }); // For published blogs
blogSchema.index({ author: 1, status: 1 }); // For user's blogs
blogSchema.index({ status: 1, trendingScore: -1 }); // For trending blogs
blogSchema.index({ tags: 1, status: 1 }); // For tag-based search
blogSchema.index({ category: 1, status: 1 }); // For category filtering
blogSchema.index({ createdAt: -1 }); // For latest blogs
blogSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
}); // Text search index

// Virtual for comments count
blogSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'blog',
  count: true,
  match: { isActive: true }
});

// Pre-save middleware to update trending score
blogSchema.pre('save', function(next) {
  if (this.isModified('likesCount') || this.isModified('views')) {
    // Simple trending algorithm: (likes * 3 + comments * 2 + views * 0.1) / age_factor
    const now = new Date();
    const ageInHours = (now - this.createdAt) / (1000 * 60 * 60);
    const ageFactor = Math.max(1, ageInHours / 24); // Decay over days
    
    this.trendingScore = (this.likesCount * 3 + (this.commentsCount || 0) * 2 + this.views * 0.1) / ageFactor;
    this.lastActivity = now;
  }
  next();
});

// Instance method to increment views
blogSchema.methods.incrementViews = async function() {
  this.views += 1;
  this.lastActivity = new Date();
  return await this.save();
};

// Instance method to toggle like
blogSchema.methods.toggleLike = async function(userId) {
  const userObjectId = mongoose.Types.ObjectId(userId);
  const likeIndex = this.likes.indexOf(userObjectId);
  
  if (likeIndex > -1) {
    // Unlike: remove user from likes array
    this.likes.splice(likeIndex, 1);
    this.likesCount = Math.max(0, this.likesCount - 1);
  } else {
    // Like: add user to likes array
    this.likes.push(userObjectId);
    this.likesCount += 1;
  }
  
  this.lastActivity = new Date();
  return await this.save();
};

// Instance method to approve blog
blogSchema.methods.approve = async function(adminNotes = '') {
  this.status = 'approved';
  this.publishedAt = new Date();
  this.adminNotes = adminNotes;
  this.rejectionReason = undefined;
  return await this.save();
};

// Instance method to reject blog
blogSchema.methods.reject = async function(reason, adminNotes = '') {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.adminNotes = adminNotes;
  this.publishedAt = undefined;
  return await this.save();
};

// Static method to get published blogs
blogSchema.statics.getPublishedBlogs = function(limit = 10, skip = 0) {
  return this.find({ status: 'approved' })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get trending blogs
blogSchema.statics.getTrendingBlogs = function(limit = 10) {
  return this.find({ status: 'approved' })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ trendingScore: -1, publishedAt: -1 })
    .limit(limit);
};

// Static method to get pending blogs (for admin)
blogSchema.statics.getPendingBlogs = function() {
  return this.find({ status: 'pending' })
    .populate('author', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method for search
blogSchema.statics.searchBlogs = function(query, limit = 10) {
  return this.find({
    status: 'approved',
    $text: { $search: query }
  })
  .populate('author', 'firstName lastName profilePicture')
  .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Blog', blogSchema);