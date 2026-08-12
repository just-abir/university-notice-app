const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Common Fields ──────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['STUDENT', 'TEACHER', 'ADMIN'],
        message: 'Role must be STUDENT, TEACHER, or ADMIN',
      },
      required: [true, 'Role is required'],
    },
    gender: {
      type: String,
      enum: {
        values: ['MALE', 'FEMALE', 'OTHER'],
        message: 'Gender must be MALE, FEMALE, or OTHER',
      },
    },
    profilePicture: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: true, // Admin-created accounts must change password on first login
    },
    expoPushToken: {
      type: String,
      default: null, // Stored when user registers device for push notifications
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    // ── Student-Only Fields ────────────────────────────────────────────────────
    roll: {
      type: String,
      trim: true,
    },
    registrationNo: {
      type: String,
      trim: true,
    },
    batch: {
      type: String,
      trim: true, // e.g. '2021', '2022'
    },
    year: {
      type: Number,
      enum: {
        values: [1, 2, 3, 4, 5],
        message: 'Year must be 1–4 for B.Sc. or 5 for Masters',
      },
    },
    semester: {
      type: Number,
      min: [1, 'Semester must be at least 1'],
      max: [10, 'Semester cannot exceed 10'],
    },

    // ── Teacher-Only Fields ────────────────────────────────────────────────────
    designation: {
      type: String,
      trim: true,
      // e.g. 'Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor'
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1, year: 1 });
userSchema.index({ role: 1, gender: 1 });
userSchema.index({ roll: 1 }, { sparse: true });

// ── Pre-save: Hash Password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance Method: Compare Password ─────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Virtual: Full display name with role ──────────────────────────────────────
userSchema.virtual('displayName').get(function () {
  if (this.role === 'TEACHER' && this.designation) {
    return `${this.designation} ${this.name}`;
  }
  return this.name;
});

const User = mongoose.model('User', userSchema);

module.exports = User;
