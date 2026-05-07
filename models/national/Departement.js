// backend/models/national/Departement.js

const mongoose = require('mongoose');

const responsableSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    fonction: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    photoUrl: { type: String, trim: true },
  },
  { _id: false }
);

const membreSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    fonction: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    photoUrl: { type: String, trim: true },
  },
  { _id: false }
);

const departementSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    responsable: responsableSchema,
    membres: {
      type: [membreSchema],
      default: [],
    },
    createdBy: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Departement', departementSchema);