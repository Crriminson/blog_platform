
# Devnovate Blog Platform

A full-stack blog platform with user authentication, admin moderation, and modern React frontend. Built with Node.js, Express, MongoDB, and React (Vite).

---

## Features
- User registration, login, and profile management
- JWT-based authentication
- Blog creation, editing, and deletion
- Like and comment on posts
- View counts for blogs
- Admin dashboard for approving/rejecting blogs and managing users
- Responsive, modern UI (React + Tailwind CSS)

---

## Project Structure

```
blog_platform/
├── backend/         # Node.js/Express API
│   ├── controllers/ # Route controllers
│   ├── middleware/  # Auth & admin middleware
│   ├── models/      # Mongoose models
│   ├── routes/      # API route definitions
│   ├── config/      # DB config
│   ├── utils/       # Validators, helpers
│   ├── server.js    # Main server entry
│   └── .env         # Environment variables
└── frontend/        # React (Vite) app
	├── src/         # Source code
	├── public/      # Static assets
	├── index.html   # Main HTML
	└── ...
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas or local MongoDB

### 1. Clone the repo
```
git clone https://github.com/Crriminson/blog_platform.git
cd blog_platform
```

### 2. Backend Setup
```
cd backend
npm install
# Copy .env.example to .env and fill in your MongoDB URI and JWT secret
npm start
```

### 3. Frontend Setup
```
cd ../frontend
npm install
npm run dev
```

---

## Deployment

- **Backend:** Deploy to Render, Heroku, or any Node.js host. Set environment variables as in `.env`.
- **Frontend:** Deploy to Vercel, Netlify, or Render static site. Set API base URL in `src/App.jsx` to your backend URL.

---

## API Reference
See `FRONTEND_API_REFERENCE.md` for all endpoints, request/response formats, and usage examples.

---

## Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `PORT` - Backend server port (default: 5000)
- `NODE_ENV` - `development` or `production`

---

## License
MIT
