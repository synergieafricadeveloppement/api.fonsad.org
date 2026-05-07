const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true },
    level: {
      type: String,
      enum: ['national', 'province', 'cellule', 'departement'],
      default: 'cellule',
    },
    department: {
      type: String,
      enum: ['rh', 'finances', 'formations', 'adhesion', 'coordination', 'secretariat', 'autre'],
      default: 'adhesion',
    },
    role: {
      type: String,
      enum: [
        'super_admin',
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
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);