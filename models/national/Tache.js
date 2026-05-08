// backend/models/national/Tache.js

const mongoose = require('mongoose');

const tacheSchema = new mongoose.Schema(
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
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'],
      default: 'TODO',
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
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

tacheSchema.index({ celluleId: 1, status: 1 });
module.exports = mongoose.model('Tache', tacheSchema);