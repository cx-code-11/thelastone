const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    // Admin-only: how the task is assigned
    assignment_type: {
      type: String,
      enum: ['user', 'team', 'self'],
      default: 'self',
    },
    assigned_to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assigned_team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

taskSchema.index({ assigned_to: 1 });
taskSchema.index({ assigned_team: 1 });

module.exports = mongoose.model('Task', taskSchema);
