const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Blog routes working',
    route: '/api/blogs/test'
  });
});

module.exports = router;