const User = require('../models/User');
const { resolveRecipients } = require('../utils/resolveRecipients');

// ── GET /api/students/search ──────────────────────────────────────────────────
const searchStudents = async (req, res) => {
  const { name, roll, year, batch, gender, page = 1, limit = 20 } = req.query;

  const query = { role: 'STUDENT', isActive: true };

  if (name) query.name = { $regex: name.trim(), $options: 'i' };
  if (roll) query.roll = { $regex: roll.trim(), $options: 'i' };
  if (year) query.year = parseInt(year, 10);
  if (batch) query.batch = { $regex: batch.trim(), $options: 'i' };
  if (gender) query.gender = gender.toUpperCase();

  const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
  const lim = Math.min(50, parseInt(limit) || 20);

  const [students, total] = await Promise.all([
    User.find(query)
      .select('name roll year batch semester gender email profilePicture registrationNo')
      .sort({ year: 1, roll: 1 })
      .skip(skip)
      .limit(lim),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      students,
      pagination: {
        total,
        page: parseInt(page),
        limit: lim,
        pages: Math.ceil(total / lim),
        hasMore: skip + students.length < total,
      },
    },
  });
};

// ── POST /api/students/resolve-audience ──────────────────────────────────────
// Preview how many students would receive a notice with the given audience config
const resolveAudience = async (req, res) => {
  const { targetAudience } = req.body;

  if (!targetAudience || !targetAudience.type) {
    return res.status(400).json({ success: false, message: 'targetAudience with type is required' });
  }

  const recipients = await resolveRecipients(targetAudience);

  // Return count + sample of first 10 students
  const sample = recipients.slice(0, 10).map((u) => ({
    _id: u._id,
    name: u.name,
    roll: u.roll,
    year: u.year,
    batch: u.batch,
    gender: u.gender,
  }));

  res.status(200).json({
    success: true,
    data: {
      count: recipients.length,
      sample,
      hasMore: recipients.length > 10,
    },
  });
};

module.exports = { searchStudents, resolveAudience };
