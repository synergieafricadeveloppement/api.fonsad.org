// backend/models/national/Membre.js

const mongoose = require('mongoose');

const membreSchema = new mongoose.Schema(
  {
    provinceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province',
      required: true,
      index: true,
    },
    celluleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cellule',
      required: true,
      index: true,
    },
    departementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Departement',
      default: null,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    sexe: {
      type: String,
      enum: ['M', 'F', 'AUTRE', ''],
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    fonction: {
      type: String,
      trim: true,
      default: 'Membre',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },

    createdBy: {
      type: String,
      trim: true,
      default: '',
    },
    updatedBy: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

membreSchema.index({ celluleId: 1, fullName: 1 });
membreSchema.index({ provinceId: 1, celluleId: 1, status: 1 });

module.exports = mongoose.model('Membre', membreSchema);