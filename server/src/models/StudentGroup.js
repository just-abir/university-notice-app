const mongoose = require('mongoose');

const studentGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Group creator is required'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: Member count ─────────────────────────────────────────────────────
studentGroupSchema.virtual('memberCount').get(function () {
  return this.members ? this.members.length : 0;
});

// ── Index ─────────────────────────────────────────────────────────────────────
studentGroupSchema.index({ createdBy: 1, name: 1 });

const StudentGroup = mongoose.model('StudentGroup', studentGroupSchema);

module.exports = StudentGroup;
