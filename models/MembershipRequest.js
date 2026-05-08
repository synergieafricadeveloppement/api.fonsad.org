// backend/models/MembershipRequest.js

const mongoose = require('mongoose');

const membershipRequestSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: '' },
    gender: {
      type: String,
      enum: ['homme', 'femme', 'autre'],
      default: 'autre',
    },
    requestedLevel: {
      type: String,
      enum: ['national', 'province', 'cellule', 'departement'],
      required: true,
    },
    requestedDepartment: {
      type: String,
      enum: ['rh', 'finances', 'formations', 'adhesion', 'coordination', 'secretariat', 'autre'],
      default: 'adhesion',
    },
    requestedRole: {
      type: String,
      enum: [
        'admin_national',
        'admin_province',
        'admin_cellule',
        'chef_departement',
        'agent_rh',
        'agent_finances',
        'agent_formations',
        'membre',
        'adherent',
      ],
      default: 'adherent',
    },
    provinceName: { type: String, trim: true, default: '' },
    celluleName: { type: String, trim: true, default: '' },
    profession: { type: String, trim: true, default: '' },
    motivation: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected'],
      default: 'submitted',
    },
    reviewComment: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MembershipRequest', membershipRequestSchema);