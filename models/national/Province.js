// backend/models/national/Province.js


const mongoose = require('mongoose');

// Sous-doc pour le responsable principal de la province.
const responsableSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    fonction: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    sexe: {
      type: String,
      trim: true,
      enum: ['M', 'F', 'AUTRE', ''],
      default: '',
    },
    photoUrl: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const provinceSchema = new mongoose.Schema(
  {
    // Nom officiel de la province (ex: Lomami).
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Code interne (ex: LOM, KIN).
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Slug pour URL/user-friendly.
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    // Pays (pour FONSAD tu peux mettre "RDC" par défaut).
    country: {
      type: String,
      default: 'RDC',
      trim: true,
    },

    // Chef-lieu / ville principale (ex: Kabinda).
    chefLieu: {
      type: String,
      trim: true,
    },

    // Adresse postale ou physique principale.
    address: {
      type: String,
      trim: true,
    },

    // Contacts généraux de la province (ex: coordination).
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Statut de la province dans le système.
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },

    // Description libre.
    description: {
      type: String,
      trim: true,
    },

    // Responsable principal de la province (coordinateur, etc.).
    responsable: responsableSchema,

    // Métriques agrégées (pour tes KPIs).
    cellulesCount: {
      type: Number,
      default: 0,
    },
    membresCount: {
      type: Number,
      default: 0,
    },

    // Traces d’audit simples.
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

provinceSchema.set('toJSON', {
  transform: (_doc, ret) => ret,
});

module.exports = mongoose.model('Province', provinceSchema);