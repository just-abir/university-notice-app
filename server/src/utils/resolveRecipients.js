const User = require('../models/User');
const StudentGroup = require('../models/StudentGroup');

/**
 * Resolves the target audience into an array of User documents.
 *
 * @param {Object} targetAudience - The audience config from the notice
 * @returns {Promise<Array>} Array of User documents (students)
 */
const resolveRecipients = async (targetAudience) => {
  const { type, rolls, rollStart, rollEnd, year, batch, customGroupId } = targetAudience;

  // Base query: only active students
  const baseQuery = { role: 'STUDENT', isActive: true };

  // Apply optional batch filter
  if (batch) baseQuery.batch = batch;

  let users = [];

  switch (type) {
    case 'SPECIFIC_ROLL': {
      if (!rolls || rolls.length === 0) return [];
      const normalizedRolls = rolls.map((r) => String(r).trim());
      users = await User.find({ ...baseQuery, roll: { $in: normalizedRolls } });
      break;
    }

    case 'ROLL_RANGE': {
      if (!rollStart || !rollEnd) return [];
      // Lexicographic range — works for numeric rolls like "2021001" - "2021060"
      users = await User.find({
        ...baseQuery,
        roll: { $gte: String(rollStart).trim(), $lte: String(rollEnd).trim() },
      });
      break;
    }

    case 'YEAR_ALL': {
      if (!year) return [];
      users = await User.find({ ...baseQuery, year: Number(year) });
      break;
    }

    case 'YEAR_FEMALE': {
      if (!year) return [];
      users = await User.find({ ...baseQuery, year: Number(year), gender: 'FEMALE' });
      break;
    }

    case 'ALL_CSE': {
      // Remove batch filter for truly "all CSE"
      const { batch: _b, ...allQuery } = baseQuery;
      users = await User.find(allQuery);
      break;
    }

    case 'ALL_CSE_FEMALE': {
      const { batch: _b, ...allQuery } = baseQuery;
      users = await User.find({ ...allQuery, gender: 'FEMALE' });
      break;
    }

    case 'CUSTOM_GROUP': {
      if (!customGroupId) return [];
      const group = await StudentGroup.findById(customGroupId).populate({
        path: 'members',
        match: { isActive: true },
      });
      if (!group) return [];
      users = group.members;
      break;
    }

    default:
      return [];
  }

  return users;
};

/**
 * Returns a human-readable description of the audience
 * @param {Object} targetAudience
 * @returns {string}
 */
const describeAudience = (targetAudience) => {
  const { type, rolls, rollStart, rollEnd, year, batch, customGroupId } = targetAudience;
  const batchStr = batch ? ` (Batch ${batch})` : '';
  const yearLabels = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: 'Masters' };

  switch (type) {
    case 'SPECIFIC_ROLL':
      return `Specific Roll(s): ${(rolls || []).join(', ')}`;
    case 'ROLL_RANGE':
      return `Roll Range: ${rollStart} – ${rollEnd}`;
    case 'YEAR_ALL':
      return `All ${yearLabels[year] || `Year ${year}`} Students${batchStr}`;
    case 'YEAR_FEMALE':
      return `All Female ${yearLabels[year] || `Year ${year}`} Students${batchStr}`;
    case 'ALL_CSE':
      return 'All CSE Students';
    case 'ALL_CSE_FEMALE':
      return 'All CSE Female Students';
    case 'CUSTOM_GROUP':
      return 'Custom Group';
    default:
      return 'Unknown Audience';
  }
};

module.exports = { resolveRecipients, describeAudience };
