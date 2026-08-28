const XLSX = require('xlsx');

// ── Column name normalization helper ──────────────────────────────────────────
const normalize = (str) => String(str || '').trim().toLowerCase().replace(/\s+/g, '');

// ── Map possible column name variants ────────────────────────────────────────
const findField = (row, variants) => {
  for (const key of Object.keys(row)) {
    if (variants.includes(normalize(key))) {
      return row[key];
    }
  }
  return undefined;
};

/**
 * Parse a Student Excel sheet.
 * Expected columns: Name, Roll, RegistrationNo, Batch, Year, Semester, Gender, Email, Phone, Address
 *
 * @param {Buffer} buffer - Excel file buffer
 * @returns {{ valid: Array, invalid: Array }}
 */
const parseStudentExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const valid = [];
  const invalid = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // 1-indexed, row 1 is header

    const name = String(findField(row, ['name', 'fullname', 'studentname']) || '').trim();
    const roll = String(findField(row, ['roll', 'rollno', 'rollnumber', 'studentroll']) || '').trim();
    const email = String(findField(row, ['email', 'emailaddress', 'mail']) || '').trim().toLowerCase();
    const registrationNo = String(findField(row, ['registrationno', 'registration', 'regno', 'regno', 'registration#']) || '').trim();
    const batch = String(findField(row, ['batch', 'session', 'admissionyear']) || '').trim();
    const yearRaw = findField(row, ['year', 'currentyear', 'studyyear']);
    const semesterRaw = findField(row, ['semester', 'sem', 'currentsemester']);
    const genderRaw = String(findField(row, ['gender', 'sex']) || '').trim().toUpperCase();
    const phone = String(findField(row, ['phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact', 'contactnumber']) || '').trim();
    const address = String(findField(row, ['address', 'homeaddress', 'permanentaddress', 'presentaddress']) || '').trim();

    const errors = [];

    // Required field validation
    if (!name) errors.push('Name is required');
    if (!roll) errors.push('Roll is required');
    if (!email) errors.push('Email is required');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.push('Invalid email format');

    // Year validation
    const year = parseInt(yearRaw, 10);
    if (yearRaw !== '' && (isNaN(year) || year < 1 || year > 5)) {
      errors.push('Year must be 1–5 (5 = Masters)');
    }

    // Gender normalization
    let gender = null;
    if (genderRaw) {
      if (['MALE', 'M'].includes(genderRaw)) gender = 'MALE';
      else if (['FEMALE', 'F'].includes(genderRaw)) gender = 'FEMALE';
      else gender = 'OTHER';
    }

    if (errors.length > 0) {
      invalid.push({ row: rowNum, data: row, errors });
    } else {
      valid.push({
        name,
        email,
        roll,
        registrationNo: registrationNo || undefined,
        batch: batch || undefined,
        year: isNaN(year) ? undefined : year,
        semester: semesterRaw ? parseInt(semesterRaw, 10) || undefined : undefined,
        gender,
        phone: phone || undefined,
        address: address || undefined,
      });
    }
  });

  console.log(`📊 Student Excel parsed: ${valid.length} valid, ${invalid.length} invalid`);
  return { valid, invalid };
};

/**
 * Parse a Teacher Excel sheet.
 * Expected columns: Name, Designation, Email, Gender
 *
 * @param {Buffer} buffer - Excel file buffer
 * @returns {{ valid: Array, invalid: Array }}
 */
const parseTeacherExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const valid = [];
  const invalid = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;

    const name = String(findField(row, ['name', 'fullname', 'teachername']) || '').trim();
    const email = String(findField(row, ['email', 'emailaddress', 'mail']) || '').trim().toLowerCase();
    const designation = String(findField(row, ['designation', 'title', 'position', 'rank']) || '').trim();
    const genderRaw = String(findField(row, ['gender', 'sex']) || '').trim().toUpperCase();

    const errors = [];

    if (!name) errors.push('Name is required');
    if (!email) errors.push('Email is required');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.push('Invalid email format');

    let gender = null;
    if (genderRaw) {
      if (['MALE', 'M'].includes(genderRaw)) gender = 'MALE';
      else if (['FEMALE', 'F'].includes(genderRaw)) gender = 'FEMALE';
      else gender = 'OTHER';
    }

    if (errors.length > 0) {
      invalid.push({ row: rowNum, data: row, errors });
    } else {
      valid.push({
        name,
        email,
        designation: designation || undefined,
        gender,
      });
    }
  });

  console.log(`📊 Teacher Excel parsed: ${valid.length} valid, ${invalid.length} invalid`);
  return { valid, invalid };
};

module.exports = { parseStudentExcel, parseTeacherExcel };
