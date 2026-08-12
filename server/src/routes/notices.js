const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { uploadPDF } = require('../middleware/upload');
const {
  createNotice,
  getMyNotices,
  getNoticeDetail,
  updateNotice,
  deleteNotice,
  getStudentFeed,
  markAsRead,
  getReadStatus,
} = require('../controllers/noticeController');
const { getComments, addComment, deleteComment } = require('../controllers/commentController');

// All routes require authentication
router.use(protect);

// ── Teacher: Notice CRUD ──────────────────────────────────────────────────────
router.get('/', requireRole('TEACHER'), getMyNotices);

// Handle multer PDF upload errors gracefully
router.post('/', requireRole('TEACHER'), (req, res, next) => {
  uploadPDF(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, createNotice);

// ── Student: Notice Feed ──────────────────────────────────────────────────────
router.get('/feed', requireRole('STUDENT'), getStudentFeed);

// ── Notice Detail (Teacher or Student) ───────────────────────────────────────
router.get('/:id', requireRole('TEACHER', 'STUDENT'), getNoticeDetail);

// ── Teacher: Update / Delete ──────────────────────────────────────────────────
router.put('/:id', requireRole('TEACHER'), (req, res, next) => {
  uploadPDF(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, updateNotice);

router.delete('/:id', requireRole('TEACHER'), deleteNotice);

// ── Student: Mark as Read ─────────────────────────────────────────────────────
router.post('/:id/read', requireRole('STUDENT'), markAsRead);

// ── Teacher: Read Status ──────────────────────────────────────────────────────
router.get('/:id/read-status', requireRole('TEACHER'), getReadStatus);

// ── Comments ──────────────────────────────────────────────────────────────────
router.get('/:id/comments', requireRole('TEACHER', 'STUDENT'), getComments);
router.post('/:id/comments', requireRole('STUDENT'), addComment);
router.delete('/:id/comments/:commentId', requireRole('TEACHER', 'STUDENT'), deleteComment);

module.exports = router;
