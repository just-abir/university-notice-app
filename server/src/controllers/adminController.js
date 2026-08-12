const crypto = require('crypto');
const User = require('../models/User');
const StudentGroup = require('../models/StudentGroup');
const { parseStudentExcel, parseTeacherExcel } = require('../services/excelService');
const { sendCredentialsEmail } = require('../services/emailService');

// ── Helper: Generate Random Password ─────────────────────────────────────────
const generateTempPassword = () => {
  // 10-char alphanumeric password
  return crypto.randomBytes(6).toString('hex'); // 12 chars hex
};

// ── POST /api/admin/import/students ──────────────────────────────────────────
const importStudents = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
  }

  const { valid, invalid } = parseStudentExcel(req.file.buffer);

  let created = 0;
  let skipped = 0;
  const errors = [...invalid.map((i) => ({ row: i.row, errors: i.errors }))];

  for (const studentData of valid) {
    try {
      const exists = await User.findOne({ email: studentData.email });
      if (exists) {
        skipped++;
        continue;
      }

      const tempPassword = generateTempPassword();

      await User.create({
        ...studentData,
        role: 'STUDENT',
        password: tempPassword,
        mustChangePassword: true,
      });

      // Send credentials email (non-blocking, don't fail on email error)
      sendCredentialsEmail({ ...studentData, role: 'STUDENT' }, tempPassword).catch((err) =>
        console.error(`Failed to send credentials to ${studentData.email}:`, err.message)
      );

      created++;
    } catch (error) {
      errors.push({ email: studentData.email, errors: [error.message] });
    }
  }

  res.status(201).json({
    success: true,
    data: {
      message: `Import complete: ${created} created, ${skipped} skipped (already exist)`,
      created,
      skipped,
      invalidRows: invalid.length,
      errors: errors.slice(0, 50), // Return at most 50 errors
    },
  });
};

// ── POST /api/admin/import/teachers ──────────────────────────────────────────
const importTeachers = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
  }

  const { valid, invalid } = parseTeacherExcel(req.file.buffer);

  let created = 0;
  let skipped = 0;
  const errors = [...invalid.map((i) => ({ row: i.row, errors: i.errors }))];

  for (const teacherData of valid) {
    try {
      const exists = await User.findOne({ email: teacherData.email });
      if (exists) {
        skipped++;
        continue;
      }

      const tempPassword = generateTempPassword();

      await User.create({
        ...teacherData,
        role: 'TEACHER',
        password: tempPassword,
        mustChangePassword: true,
      });

      sendCredentialsEmail({ ...teacherData, role: 'TEACHER' }, tempPassword).catch((err) =>
        console.error(`Failed to send credentials to ${teacherData.email}:`, err.message)
      );

      created++;
    } catch (error) {
      errors.push({ email: teacherData.email, errors: [error.message] });
    }
  }

  res.status(201).json({
    success: true,
    data: {
      message: `Import complete: ${created} created, ${skipped} skipped (already exist)`,
      created,
      skipped,
      invalidRows: invalid.length,
      errors: errors.slice(0, 50),
    },
  });
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const query = {};

  if (role) query.role = role.toUpperCase();
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { roll: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
  const lim = Math.min(100, parseInt(limit) || 20);

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(lim),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) },
    },
  });
};

// ── GET /api/admin/groups ─────────────────────────────────────────────────────
const getGroups = async (req, res) => {
  const query = req.user.role === 'ADMIN' ? {} : { createdBy: req.user._id };

  const groups = await StudentGroup.find(query)
    .populate('createdBy', 'name designation')
    .select('name description createdBy members createdAt')
    .sort({ createdAt: -1 });

  const groupsWithCount = groups.map((g) => ({
    ...g.toObject(),
    memberCount: g.members.length,
  }));

  res.status(200).json({ success: true, data: { groups: groupsWithCount } });
};

// ── POST /api/admin/groups ────────────────────────────────────────────────────
const createGroup = async (req, res) => {
  const { name, description, memberIds } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Group name is required' });
  }

  // Validate member IDs are valid students
  let members = [];
  if (memberIds && memberIds.length > 0) {
    members = await User.find({
      _id: { $in: memberIds },
      role: 'STUDENT',
      isActive: true,
    }).select('_id');
    members = members.map((u) => u._id);
  }

  const group = await StudentGroup.create({
    name: name.trim(),
    description: description ? description.trim() : undefined,
    createdBy: req.user._id,
    members,
  });

  const populated = await group.populate('createdBy', 'name designation');

  res.status(201).json({ success: true, data: { group: populated } });
};

// ── PUT /api/admin/groups/:id ─────────────────────────────────────────────────
const updateGroup = async (req, res) => {
  const group = await StudentGroup.findOne({ _id: req.params.id, createdBy: req.user._id });

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found or unauthorized' });
  }

  const { name, description, memberIds } = req.body;

  if (name) group.name = name.trim();
  if (description !== undefined) group.description = description.trim();

  if (memberIds !== undefined) {
    const members = await User.find({
      _id: { $in: memberIds },
      role: 'STUDENT',
      isActive: true,
    }).select('_id');
    group.members = members.map((u) => u._id);
  }

  await group.save();
  const populated = await group.populate([
    { path: 'createdBy', select: 'name designation' },
    { path: 'members', select: 'name roll year batch gender' },
  ]);

  res.status(200).json({ success: true, data: { group: populated } });
};

// ── DELETE /api/admin/groups/:id ──────────────────────────────────────────────
const deleteGroup = async (req, res) => {
  const group = await StudentGroup.findOne({ _id: req.params.id, createdBy: req.user._id });

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found or unauthorized' });
  }

  await group.deleteOne();

  res.status(200).json({ success: true, message: 'Group deleted successfully' });
};

module.exports = {
  importStudents,
  importTeachers,
  getAllUsers,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
};
