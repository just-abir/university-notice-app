const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { uploadExcel } = require('../middleware/upload');
const {
  importStudents,
  importTeachers,
  getAllUsers,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} = require('../controllers/adminController');

// All routes require authentication
router.use(protect);

// ── Admin Only ────────────────────────────────────────────────────────────────
router.post('/import/students', requireRole('ADMIN'), (req, res, next) => {
  uploadExcel(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, importStudents);

router.post('/import/teachers', requireRole('ADMIN'), (req, res, next) => {
  uploadExcel(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, importTeachers);

router.get('/users', requireRole('ADMIN'), getAllUsers);

// ── Teacher & Admin: Student Groups ──────────────────────────────────────────
router.get('/groups', requireRole('TEACHER', 'ADMIN'), getGroups);
router.post('/groups', requireRole('TEACHER'), createGroup);
router.put('/groups/:id', requireRole('TEACHER'), updateGroup);
router.delete('/groups/:id', requireRole('TEACHER'), deleteGroup);

module.exports = router;
