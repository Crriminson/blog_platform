# Devnovate Blog Platform - Complete API Reference & Frontend Context

## Base URL
```
http://localhost:5000/api
```

## Authentication Headers
```javascript
// For protected routes, include JWT token in headers:
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

## Complete API Endpoints

### Authentication Endpoints (/api/auth)

#### POST /api/auth/register
**Purpose**: Register new user account
**Body**:
```json
{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "email": "string (valid email format)",
  "password": "string (min 6 chars)",
  "firstName": "string (required)",
  "lastName": "string (required)"
}
```
**Response (201)**:
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_string",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email",
    "firstName": "firstName",
    "lastName": "lastName",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-08-30T...",
    "avatar": "avatar_url_or_null"
  }
}
```

#### POST /api/auth/login
**Purpose**: User login
**Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
**Response (200)**:
```json
{
  "message": "Login successful",
  "token": "jwt_token_string",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email",
    "firstName": "firstName",
    "lastName": "lastName",
    "role": "user|admin",
    "isActive": true,
    "avatar": "avatar_url_or_null"
  }
}
```

#### GET /api/auth/profile
**Purpose**: Get current user profile
**Auth**: Required
**Response (200)**:
```json
{
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email",
    "firstName": "firstName",
    "lastName": "lastName",
    "role": "user|admin",
    "isActive": true,
    "createdAt": "2025-08-30T...",
    "avatar": "avatar_url_or_null",
    "bio": "user_bio_or_null"
  }
}
```

#### PUT /api/auth/profile
**Purpose**: Update user profile
**Auth**: Required
**Body**:
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "bio": "string (optional, max 500 chars)",
  "avatar": "string (optional, URL)"
}
```
**Response (200)**:
```json
{
  "message": "Profile updated successfully",
  "user": "updated_user_object"
}
```

#### PUT /api/auth/change-password
**Purpose**: Change user password
**Auth**: Required
**Body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 6 chars)"
}
```
**Response (200)**:
```json
{
  "message": "Password changed successfully"
}
```

### Blog Endpoints (/api/blogs)

#### POST /api/blogs
**Purpose**: Create new blog post (status: pending)
**Auth**: Required
**Body**:
```json
{
  "title": "string (required, max 200 chars)",
  "content": "string (required)",
  "excerpt": "string (optional, max 300 chars)",
  "tags": ["string", "array", "optional"],
  "featuredImage": "string (optional, URL)"
}
```
**Response (201)**:
```json
{
  "message": "Blog created successfully",
  "blog": {
    "id": "blog_id",
    "title": "title",
    "content": "content",
    "excerpt": "excerpt",
    "author": "author_object",
    "status": "pending",
    "tags": ["tag1", "tag2"],
    "featuredImage": "image_url",
    "createdAt": "2025-08-30T...",
    "likes": [],
    "views": 0,
    "likesCount": 0,
    "commentsCount": 0
  }
}
```

#### GET /api/blogs
**Purpose**: Get all blogs with filtering
**Query Parameters**:
- `status` (optional): "approved", "pending", "rejected", "draft"
- `author` (optional): author_id
- `tags` (optional): comma-separated tags
- `search` (optional): search term for title/content
- `page` (optional): page number (default: 1)
- `limit` (optional): items per page (default: 10)
- `sort` (optional): "latest", "oldest", "popular", "trending"

**Response (200)**:
```json
{
  "blogs": [
    {
      "id": "blog_id",
      "title": "title",
      "excerpt": "excerpt",
      "author": {
        "id": "author_id",
        "username": "username",
        "firstName": "firstName",
        "lastName": "lastName",
        "avatar": "avatar_url"
      },
      "status": "approved",
      "tags": ["tag1", "tag2"],
      "featuredImage": "image_url",
      "createdAt": "2025-08-30T...",
      "updatedAt": "2025-08-30T...",
      "views": 10,
      "likesCount": 5,
      "commentsCount": 3,
      "isLiked": false
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalBlogs": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET /api/blogs/:id
**Purpose**: Get single blog by ID (increments view count)
**Auth**: Optional (affects isLiked field)
**Response (200)**:
```json
{
  "blog": {
    "id": "blog_id",
    "title": "title",
    "content": "full_content",
    "excerpt": "excerpt",
    "author": {
      "id": "author_id",
      "username": "username",
      "firstName": "firstName",
      "lastName": "lastName",
      "avatar": "avatar_url",
      "bio": "author_bio"
    },
    "status": "approved",
    "tags": ["tag1", "tag2"],
    "featuredImage": "image_url",
    "createdAt": "2025-08-30T...",
    "updatedAt": "2025-08-30T...",
    "views": 11,
    "likesCount": 5,
    "commentsCount": 3,
    "isLiked": false,
    "readTime": 5
  }
}
```

#### PUT /api/blogs/:id
**Purpose**: Update blog (only author can update, resets to pending if approved)
**Auth**: Required (author only)
**Body**: Same as POST /api/blogs
**Response (200)**:
```json
{
  "message": "Blog updated successfully",
  "blog": "updated_blog_object"
}
```

#### DELETE /api/blogs/:id
**Purpose**: Delete blog
**Auth**: Required (author only)
**Response (200)**:
```json
{
  "message": "Blog deleted successfully"
}
```

#### POST /api/blogs/:id/like
**Purpose**: Toggle like on blog
**Auth**: Required
**Response (200)**:
```json
{
  "message": "Blog liked/unliked successfully",
  "isLiked": true,
  "likesCount": 6
}
```

### Admin Endpoints (/api/admin)

#### GET /api/admin/pending-blogs
**Purpose**: Get all pending blogs for approval
**Auth**: Required (admin only)
**Query Parameters**: page, limit
**Response (200)**:
```json
{
  "blogs": [
    {
      "id": "blog_id",
      "title": "title",
      "excerpt": "excerpt",
      "author": "author_object",
      "createdAt": "2025-08-30T...",
      "status": "pending"
    }
  ],
  "pagination": "pagination_object"
}
```

#### PUT /api/admin/blogs/:id/approve
**Purpose**: Approve pending blog
**Auth**: Required (admin only)
**Response (200)**:
```json
{
  "message": "Blog approved successfully",
  "blog": "updated_blog_object"
}
```

#### PUT /api/admin/blogs/:id/reject
**Purpose**: Reject pending blog
**Auth**: Required (admin only)
**Body**:
```json
{
  "rejectionReason": "string (optional)"
}
```
**Response (200)**:
```json
{
  "message": "Blog rejected successfully",
  "blog": "updated_blog_object"
}
```

#### GET /api/admin/users
**Purpose**: Get all users for management
**Auth**: Required (admin only)
**Query Parameters**: page, limit, search, status
**Response (200)**:
```json
{
  "users": [
    {
      "id": "user_id",
      "username": "username",
      "email": "email",
      "firstName": "firstName",
      "lastName": "lastName",
      "role": "user",
      "isActive": true,
      "createdAt": "2025-08-30T...",
      "blogsCount": 5
    }
  ],
  "pagination": "pagination_object"
}
```

#### PUT /api/admin/users/:id/toggle-status
**Purpose**: Activate/deactivate user
**Auth**: Required (admin only)
**Response (200)**:
```json
{
  "message": "User status updated successfully",
  "user": "updated_user_object"
}
```

#### GET /api/admin/analytics
**Purpose**: Get dashboard analytics
**Auth**: Required (admin only)
**Response (200)**:
```json
{
  "totalUsers": 150,
  "totalBlogs": 300,
  "pendingBlogs": 25,
  "approvedBlogs": 250,
  "rejectedBlogs": 25,
  "totalComments": 500,
  "activeUsers": 120,
  "recentActivity": [
    {
      "type": "user_registered|blog_created|blog_approved",
      "description": "activity_description",
      "timestamp": "2025-08-30T...",
      "user": "user_object (optional)"
    }
  ],
  "popularTags": [
    {
      "tag": "javascript",
      "count": 45
    }
  ]
}
```

### Comment Endpoints (/api/comments)

#### POST /api/comments
**Purpose**: Add comment to blog
**Auth**: Required
**Body**:
```json
{
  "blogId": "string (required)",
  "content": "string (required, max 1000 chars)",
  "parentId": "string (optional, for replies)"
}
```
**Response (201)**:
```json
{
  "message": "Comment added successfully",
  "comment": {
    "id": "comment_id",
    "content": "content",
    "author": "author_object",
    "blog": "blog_id",
    "parentId": "parent_id_or_null",
    "replies": [],
    "createdAt": "2025-08-30T...",
    "updatedAt": "2025-08-30T...",
    "isReported": false,
    "depth": 0
  }
}
```

#### GET /api/comments/:blogId
**Purpose**: Get all comments for a blog
**Query Parameters**: page, limit
**Response (200)**:
```json
{
  "comments": [
    {
      "id": "comment_id",
      "content": "content",
      "author": {
        "id": "author_id",
        "username": "username",
        "firstName": "firstName",
        "lastName": "lastName",
        "avatar": "avatar_url"
      },
      "parentId": null,
      "replies": [
        {
          "id": "reply_id",
          "content": "reply_content",
          "author": "author_object",
          "parentId": "parent_comment_id",
          "replies": [],
          "createdAt": "2025-08-30T...",
          "depth": 1
        }
      ],
      "createdAt": "2025-08-30T...",
      "updatedAt": "2025-08-30T...",
      "depth": 0
    }
  ],
  "pagination": "pagination_object"
}
```

#### PUT /api/comments/:id
**Purpose**: Update comment (author only, within 5 minutes)
**Auth**: Required (author only)
**Body**:
```json
{
  "content": "string (required)"
}
```
**Response (200)**:
```json
{
  "message": "Comment updated successfully",
  "comment": "updated_comment_object"
}
```

#### DELETE /api/comments/:id
**Purpose**: Delete comment (soft delete)
**Auth**: Required (author or admin)
**Response (200)**:
```json
{
  "message": "Comment deleted successfully"
}
```

#### POST /api/comments/:id/report
**Purpose**: Report inappropriate comment
**Auth**: Required
**Body**:
```json
{
  "reason": "string (optional)"
}
```
**Response (200)**:
```json
{
  "message": "Comment reported successfully"
}
```

## Data Models

### User Object
```javascript
{
  id: String,
  username: String,
  email: String,
  firstName: String,
  lastName: String,
  role: "user" | "admin",
  isActive: Boolean,
  avatar: String | null,
  bio: String | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Blog Object
```javascript
{
  id: String,
  title: String,
  content: String,
  excerpt: String,
  author: User,
  status: "draft" | "pending" | "approved" | "rejected",
  tags: [String],
  featuredImage: String | null,
  views: Number,
  likes: [UserId],
  likesCount: Number,
  commentsCount: Number,
  rejectionReason: String | null,
  createdAt: Date,
  updatedAt: Date,
  approvedAt: Date | null,
  readTime: Number // calculated
}
```

### Comment Object
```javascript
{
  id: String,
  content: String,
  author: User,
  blog: BlogId,
  parentId: CommentId | null,
  replies: [Comment],
  isReported: Boolean,
  reportReason: String | null,
  depth: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Response Format
```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "field_error_message"
    }
  ]
}
```

## Authentication Flow

### 1. Register/Login
- Use POST /api/auth/register or POST /api/auth/login
- Store the returned JWT token in localStorage/sessionStorage
- Include token in Authorization header for protected routes

### 2. Token Storage (Frontend)
```javascript
// Store token
localStorage.setItem('token', response.token);
localStorage.setItem('user', JSON.stringify(response.user));

// Retrieve token
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// Clear on logout
localStorage.removeItem('token');
localStorage.removeItem('user');
```

### 3. API Request Helper (Frontend)
```javascript
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...options
  };
  
  const response = await fetch(`http://localhost:5000/api${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};
```

## Business Logic Rules

### Blog Workflow
1. **Create**: User creates blog → Status = "pending"
2. **Admin Review**: Admin approves/rejects pending blogs
3. **Update**: If author updates approved blog → Status resets to "pending"
4. **Public View**: Only "approved" blogs visible to public
5. **Author View**: Authors see all their blogs regardless of status

### Comment System
- **Nesting**: Maximum 3 levels deep (depth 0, 1, 2)
- **Edit Window**: Authors can edit comments within 5 minutes of creation
- **Soft Delete**: Comments are marked as deleted, not physically removed
- **Reporting**: Users can report inappropriate comments for admin review

### Trending Algorithm
- Based on likes and recent activity
- Blogs with more recent likes rank higher
- View count also contributes to trending score

### Authorization Levels
- **Public**: Can view approved blogs and comments
- **User**: Can create blogs, comment, like, manage own content
- **Admin**: Can approve/reject blogs, manage users, view analytics

## Frontend Architecture Recommendations

### 1. Component Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ProtectedRoute.jsx
│   ├── blog/
│   │   ├── BlogCard.jsx
│   │   ├── BlogDetail.jsx
│   │   ├── BlogForm.jsx
│   │   └── BlogList.jsx
│   ├── comment/
│   │   ├── CommentForm.jsx
│   │   ├── CommentList.jsx
│   │   └── Comment.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── PendingBlogs.jsx
│   │   └── UserManagement.jsx
│   └── common/
│       ├── Header.jsx
│       ├── Footer.jsx
│       └── Pagination.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useApi.js
│   └── usePagination.js
├── context/
│   └── AuthContext.js
└── utils/
    ├── api.js
    └── helpers.js
```

### 2. State Management
- Use React Context for authentication state
- Use local state for component-specific data
- Consider React Query for server state management

### 3. Route Structure
```javascript
/login
/register
/dashboard (user dashboard)
/blog/:id
/create-blog
/edit-blog/:id
/admin/dashboard
/admin/pending-blogs
/admin/users
/profile
/settings
```

### 4. Key Features to Implement
- **Authentication**: Login/register forms with validation
- **Blog Management**: Create, edit, view, delete blogs
- **Admin Panel**: Approve/reject blogs, manage users
- **Comment System**: Nested comments with reply functionality
- **Search & Filter**: Search blogs, filter by tags/status
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Consider WebSocket for live updates

This complete reference provides everything needed to build the frontend React application that integrates with the Devnovate blog platform backend.
