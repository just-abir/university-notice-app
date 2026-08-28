const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      trim: true,
      maxlength: [5000, 'Body cannot exceed 5000 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['TEXT', 'PDF'],
        message: 'Notice type must be TEXT or PDF',
      },
      default: 'TEXT',
    },
    // ── PDF Fields (Cloudinary) ────────────────────────────────────────────────
    pdfUrl: {
      type: String,
      default: null,
    },
    pdfPublicId: {
      type: String,
      default: null, // Cloudinary public_id used for deletion
    },

    // ── Authorship ─────────────────────────────────────────────────────────────
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },

    // ── Target Audience Configuration ──────────────────────────────────────────
    targetAudience: {
      type: {
        type: String,
        enum: {
          values: [
            'SPECIFIC_ROLL',      // Specific student roll(s)
            'ROLL_RANGE',         // Range of rolls (rollStart to rollEnd)
            'YEAR_ALL',           // All students of a specific year
            'YEAR_FEMALE',        // All female students of a specific year
            'ALL_CSE',            // All CSE students
            'ALL_CSE_FEMALE',     // All CSE female students
            'CUSTOM_GROUP',       // A teacher-defined custom group
            'SELECTED_STUDENTS',  // Teacher hand-picked individual students
          ],
          message: 'Invalid audience type',
        },
        required: true,
      },
      rolls: [String],                        // For SPECIFIC_ROLL
      rollStart: String,                       // For ROLL_RANGE
      rollEnd: String,                         // For ROLL_RANGE
      year: { type: Number, min: 1, max: 5 }, // For YEAR_ALL, YEAR_FEMALE
      batch: String,                           // Optional batch filter
      customGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentGroup',
      },
      selectedIds: [                               // For SELECTED_STUDENTS
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },

    // ── Recipients ─────────────────────────────────────────────────────────────
    // Pre-computed at notice creation time for fast queries
    resolvedRecipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // ── Read Tracking ──────────────────────────────────────────────────────────
    readBy: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ── Soft Delete ────────────────────────────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
noticeSchema.index({ author: 1, isDeleted: 1, createdAt: -1 });
noticeSchema.index({ resolvedRecipients: 1, isDeleted: 1, createdAt: -1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
noticeSchema.virtual('readCount').get(function () {
  return this.readBy ? this.readBy.length : 0;
});

noticeSchema.virtual('unreadCount').get(function () {
  const total = this.resolvedRecipients ? this.resolvedRecipients.length : 0;
  const read = this.readBy ? this.readBy.length : 0;
  return Math.max(0, total - read);
});

noticeSchema.virtual('recipientCount').get(function () {
  return this.resolvedRecipients ? this.resolvedRecipients.length : 0;
});

// ── Query Middleware: Auto-exclude deleted ────────────────────────────────────
// Note: controllers will explicitly filter isDeleted for flexibility

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
