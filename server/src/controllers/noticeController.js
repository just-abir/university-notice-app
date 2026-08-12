const Notice = require('../models/Notice');
const User = require('../models/User');
const { resolveRecipients, describeAudience } = require('../utils/resolveRecipients');
const { deleteFromCloudinary } = require('../config/cloudinary');
const { sendBulkPushNotifications } = require('../services/pushNotificationService');
const { sendNoticeEmail } = require('../services/emailService');

// ── POST /api/notices ─────────────────────────────────────────────────────────
const createNotice = async (req, res) => {
  const { title, body, type, targetAudience } = req.body;

  // Validate required fields
  if (!title) {
    return res.status(400).json({ success: false, message: 'Notice title is required' });
  }

  let parsedAudience;
  try {
    parsedAudience = typeof targetAudience === 'string' ? JSON.parse(targetAudience) : targetAudience;
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid targetAudience format' });
  }

  if (!parsedAudience || !parsedAudience.type) {
    return res.status(400).json({ success: false, message: 'Target audience type is required' });
  }

  if (type === 'TEXT' && !body) {
    return res.status(400).json({ success: false, message: 'Body is required for TEXT notices' });
  }

  if (type === 'PDF' && !req.file) {
    return res.status(400).json({ success: false, message: 'PDF file is required for PDF notices' });
  }

  // Resolve recipients
  const recipients = await resolveRecipients(parsedAudience);
  const recipientIds = recipients.map((u) => u._id);

  // Build notice data
  const noticeData = {
    title: title.trim(),
    body: body ? body.trim() : undefined,
    type: type || 'TEXT',
    author: req.user._id,
    targetAudience: parsedAudience,
    resolvedRecipients: recipientIds,
  };

  // Attach PDF info if uploaded
  if (req.file) {
    noticeData.pdfUrl = req.file.path; // Cloudinary URL via multer-storage-cloudinary
    noticeData.pdfPublicId = req.file.filename;
  }

  const notice = await Notice.create(noticeData);

  // ── Send Notifications Asynchronously ────────────────────────────────────────
  // Fire-and-forget — don't block the response
  setImmediate(async () => {
    try {
      const teacher = req.user;
      const pushTokens = [];
      const emailStudents = [];

      recipients.forEach((student) => {
        if (student.expoPushToken) {
          pushTokens.push(student.expoPushToken);
        } else {
          emailStudents.push(student);
        }
      });

      // Push notifications
      if (pushTokens.length > 0) {
        await sendBulkPushNotifications(pushTokens, `📢 ${title}`, body || 'New PDF notice received', {
          noticeId: notice._id.toString(),
          type: 'NEW_NOTICE',
        });
      }

      // Email fallback for students without push tokens
      const emailPromises = emailStudents.map((student) =>
        sendNoticeEmail(student, notice, teacher).catch((err) =>
          console.error(`Email failed for ${student.email}:`, err.message)
        )
      );
      await Promise.allSettled(emailPromises);

      console.log(`✅ Notifications sent: ${pushTokens.length} push, ${emailStudents.length} email`);
    } catch (error) {
      console.error('Notification dispatch error:', error.message);
    }
  });

  const populated = await Notice.findById(notice._id).populate('author', 'name designation email');

  res.status(201).json({
    success: true,
    data: {
      notice: {
        ...populated.toObject(),
        recipientCount: recipientIds.length,
      },
    },
  });
};

// ── GET /api/notices (Teacher: My Notices) ────────────────────────────────────
const getMyNotices = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : '';

  const query = { author: req.user._id, isDeleted: false };
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  const [notices, total] = await Promise.all([
    Notice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name designation'),
    Notice.countDocuments(query),
  ]);

  const noticesWithStats = notices.map((n) => {
    const obj = n.toObject({ virtuals: true });
    return {
      ...obj,
      recipientCount: n.resolvedRecipients.length,
      readCount: n.readBy.length,
      unreadCount: Math.max(0, n.resolvedRecipients.length - n.readBy.length),
    };
  });

  res.status(200).json({
    success: true,
    data: {
      notices: noticesWithStats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    },
  });
};

// ── GET /api/notices/:id (Teacher or Student) ─────────────────────────────────
const getNoticeDetail = async (req, res) => {
  const notice = await Notice.findOne({ _id: req.params.id, isDeleted: false })
    .populate('author', 'name designation email profilePicture')
    .populate('readBy.student', 'name roll year');

  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found' });
  }

  // Students can only view notices they are recipients of
  if (req.user.role === 'STUDENT') {
    const isRecipient = notice.resolvedRecipients.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (!isRecipient) {
      return res.status(403).json({ success: false, message: 'You do not have access to this notice' });
    }
  }

  // Teachers can only view their own notices
  if (req.user.role === 'TEACHER' && notice.author._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only view your own notices' });
  }

  const obj = notice.toObject({ virtuals: true });
  const isRead =
    req.user.role === 'STUDENT'
      ? notice.readBy.some((r) => r.student && r.student._id.toString() === req.user._id.toString())
      : undefined;

  res.status(200).json({
    success: true,
    data: {
      notice: {
        ...obj,
        recipientCount: notice.resolvedRecipients.length,
        readCount: notice.readBy.length,
        unreadCount: Math.max(0, notice.resolvedRecipients.length - notice.readBy.length),
        isRead,
        audienceDescription: describeAudience(notice.targetAudience),
      },
    },
  });
};

// ── PUT /api/notices/:id ──────────────────────────────────────────────────────
const updateNotice = async (req, res) => {
  const notice = await Notice.findOne({
    _id: req.params.id,
    author: req.user._id,
    isDeleted: false,
  });

  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found or unauthorized' });
  }

  const { title, body } = req.body;
  if (title) notice.title = title.trim();
  if (body !== undefined) notice.body = body.trim();

  // Handle PDF replacement
  if (req.file) {
    // Delete old PDF from Cloudinary
    if (notice.pdfPublicId) {
      await deleteFromCloudinary(notice.pdfPublicId);
    }
    notice.pdfUrl = req.file.path;
    notice.pdfPublicId = req.file.filename;
    notice.type = 'PDF';
  }

  await notice.save();

  res.status(200).json({ success: true, data: { notice } });
};

// ── DELETE /api/notices/:id (Soft Delete) ─────────────────────────────────────
const deleteNotice = async (req, res) => {
  const notice = await Notice.findOne({
    _id: req.params.id,
    author: req.user._id,
    isDeleted: false,
  });

  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found or unauthorized' });
  }

  notice.isDeleted = true;
  await notice.save();

  res.status(200).json({ success: true, message: 'Notice deleted successfully' });
};

// ── GET /api/notices/feed (Student) ──────────────────────────────────────────
const getStudentFeed = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const filter = req.query.filter; // 'read' | 'unread' | undefined (all)

  const studentId = req.user._id;

  // Base query: student is a recipient
  const query = {
    resolvedRecipients: studentId,
    isDeleted: false,
  };

  // Filter by read/unread
  if (filter === 'read') {
    query['readBy.student'] = studentId;
  } else if (filter === 'unread') {
    query['readBy.student'] = { $ne: studentId };
  }

  const [notices, total] = await Promise.all([
    Notice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name designation profilePicture')
      .select('-resolvedRecipients -readBy'),
    Notice.countDocuments(query),
  ]);

  // Get read notice IDs for this student
  const readNoticeIds = await Notice.find({
    _id: { $in: notices.map((n) => n._id) },
    'readBy.student': studentId,
  }).select('_id');
  const readSet = new Set(readNoticeIds.map((n) => n._id.toString()));

  const feed = notices.map((n) => ({
    ...n.toObject(),
    isRead: readSet.has(n._id.toString()),
  }));

  res.status(200).json({
    success: true,
    data: {
      notices: feed,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    },
  });
};

// ── POST /api/notices/:id/read (Student) ──────────────────────────────────────
const markAsRead = async (req, res) => {
  const notice = await Notice.findOne({
    _id: req.params.id,
    resolvedRecipients: req.user._id,
    isDeleted: false,
  });

  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found or not in your feed' });
  }

  const alreadyRead = notice.readBy.some(
    (r) => r.student.toString() === req.user._id.toString()
  );

  if (!alreadyRead) {
    notice.readBy.push({ student: req.user._id, readAt: new Date() });
    await notice.save();
  }

  res.status(200).json({ success: true, message: 'Marked as read' });
};

// ── GET /api/notices/:id/read-status (Teacher) ────────────────────────────────
const getReadStatus = async (req, res) => {
  const notice = await Notice.findOne({
    _id: req.params.id,
    author: req.user._id,
    isDeleted: false,
  })
    .populate('resolvedRecipients', 'name roll year batch profilePicture email')
    .populate('readBy.student', 'name roll year batch profilePicture');

  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found or unauthorized' });
  }

  const readStudentIds = new Set(
    notice.readBy.filter((r) => r.student).map((r) => r.student._id.toString())
  );

  const readWithTime = notice.readBy
    .filter((r) => r.student)
    .map((r) => ({
      student: r.student,
      readAt: r.readAt,
    }));

  const unread = notice.resolvedRecipients.filter(
    (student) => !readStudentIds.has(student._id.toString())
  );

  res.status(200).json({
    success: true,
    data: {
      noticeId: notice._id,
      title: notice.title,
      totalRecipients: notice.resolvedRecipients.length,
      readCount: readWithTime.length,
      unreadCount: unread.length,
      readPercentage:
        notice.resolvedRecipients.length > 0
          ? Math.round((readWithTime.length / notice.resolvedRecipients.length) * 100)
          : 0,
      read: readWithTime,
      unread,
    },
  });
};

module.exports = {
  createNotice,
  getMyNotices,
  getNoticeDetail,
  updateNotice,
  deleteNotice,
  getStudentFeed,
  markAsRead,
  getReadStatus,
};
