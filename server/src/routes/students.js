const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { searchStudents, resolveAudience } = require('../controllers/studentController');

// All routes require Teacher authentication
router.use(protect, requireRole('TEACHER'));

router.get('/search', searchStudents);
router.post('/resolve-audience', resolveAudience);

module.exports = router;
