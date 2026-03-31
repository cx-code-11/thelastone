const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned user is required'],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tenant: {
      type: String,
      required: [true, 'Tenant is required'],
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for fast tenant-scoped queries
taskSchema.index({ tenant: 1, assigned_to: 1 });

module.exports = mongoose.model('Task', taskSchema);
