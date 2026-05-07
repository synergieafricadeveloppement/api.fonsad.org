const mongoose = require('mongoose');

const organizationUnitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ['national', 'province', 'cellule', 'departement'],
      required: true,
    },
    department: {
      type: String,
      enum: ['rh', 'finances', 'formations', 'adhesion', 'coordination', 'secretariat', 'autre', ''],
      default: '',
    },
    provinceName: {
      type: String,
      trim: true,
      default: '',
    },
    parentUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganizationUnit',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrganizationUnit', organizationUnitSchema);