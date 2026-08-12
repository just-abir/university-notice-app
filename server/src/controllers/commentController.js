const Comment = require('../models/Comment');
const Notice = require('../models/Notice');

// ── GET /api/notices/:id/comments ─────────────────────────────────────────────
const getComments = async (req, res) => {
  const notice = await Notice.findOne({ _id: req.params.id, isDeleted: false }).select('_id author resolvedRecipients');

  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found' });
  }

  // Students must be recipients to view comments
  if (req.user.role === 'STUDENT') {
    const isRecipient = notice.resolvedRecipients.some((id) => id.toString() === req.user._id.toString());
    if (!isRecipient) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  }

  // Teachers can only see comments on their own notices
  if (req.user.role === 'TEACHER' && notice.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const comments = await Comment.find({ notice: req.params.id, isDeleted: false })
    .populate('author', 'name roll year profilePicture role')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    data: { comments, total: comments.length },
  });
};

// ── POST /api/notices/:id/comments ────────────────────────────────────────────
const addComment = async (req, res) => {
  const { body } = req.body;

  if (!body || !body.trim()) {
    return res.status(400).json({ success: false, message: 'Comment body is required' });
  }

  const notice = await Notice.findOne({
    _id: req.params.id,
    resolvedRecipients: req.user._id,
    isDeleted: false,
  }).select('_id');

  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found or you are not a recipient' });
  }

  const comment = await Comment.create({
    notice: req.params.id,
    author: req.user._id,
    body: body.trim(),
  });

  const populated = await comment.populate('author', 'name roll year profilePicture role');

  res.status(201).json({ success: true, data: { comment: populated } });
};

// ── DELETE /api/notices/:id/comments/:commentId ───────────────────────────────
const deleteComment = async (req, res) => {
  const comment = await Comment.findOne({
    _id: req.params.commentId,
    notice: req.params.id,
    isDeleted: false,
  }).populate('notice', 'author');

  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  const isOwner = comment.author.toString() === req.user._id.toString();
  const isNoticeAuthor =
    req.user.role === 'TEACHER' &&
    comment.notice.author &&
    comment.notice.author.toString() === req.user._id.toString();

  if (!isOwner && !isNoticeAuthor) {
    return res.status(403).json({ success: false, message: 'You are not authorized to delete this comment' });
  }

  comment.isDeleted = true;
  await comment.save();

  res.status(200).json({ success: true, message: 'Comment deleted' });
};

module.exports = { getComments, addComment, deleteComment };
