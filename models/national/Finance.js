// backend/models/national/Finance.js

const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema(
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

    libelle: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['ENTREE', 'SORTIE'],
      required: true,
      index: true,
    },
    montant: {
      type: Number,
      required: true,
      min: 0,
    },
    devise: {
      type: String,
      trim: true,
      default: 'CDF',
    },
    dateOperation: {
      type: Date,
      default: Date.now,
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

financeSchema.index({ celluleId: 1, type: 1 });
module.exports = mongoose.model('Finance', financeSchema);