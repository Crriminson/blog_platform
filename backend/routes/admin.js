const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Admin routes working',
    route: '/api/admin/test'
  });
});

module.exports = router;