// backend/models/national/Formation.js

const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema(
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

    title: {
      type: String,
      required: true,
      trim: true,
    },
    theme: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'ONGOING', 'DONE', 'CANCELLED'],
      default: 'PLANNED',
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

formationSchema.index({ celluleId: 1, status: 1 });
module.exports = mongoose.model('Formation', formationSchema);