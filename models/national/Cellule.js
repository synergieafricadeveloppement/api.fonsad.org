// backend/models/national/Cellule.js

const mongoose = require('mongoose');

const responsableSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    fonction: {
      type: String,
      required: false,
      trim: true,
      default: 'Responsable cellule',
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
    photoUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    _id: false,
  }
);

const celluleSchema = new mongoose.Schema(
  {
    // Référence vers la province (clé étrangère)
    provinceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province',
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
      // tu peux mettre required: true si tu veux forcer au backend
      // required: true,
    },

    type: {
      type: String,
      enum: ['COMMUNE', 'BASE', 'AGENCE', 'ANTENNE'],
      default: 'COMMUNE',
      index: true,
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },

    commune: {
      type: String,
      trim: true,
      default: '',
    },

    zone: {
      type: String,
      trim: true,
      default: '',
    },

    address: {
      type: String,
      trim: true,
      default: '',
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

    description: {
      type: String,
      trim: true,
      default: '',
    },

    responsable: {
      type: responsableSchema,
      required: false,
      default: () => ({}),
    },

    departementsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    membresCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    tachesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    financesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    formationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    adhesionsCount: {
      type: Number,
      default: 0,
      min: 0,
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
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString?.() || ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString?.() || ret.id;
        return ret;
      },
    },
  }
);

celluleSchema.virtual('id').get(function getId() {
  return this._id?.toString?.();
});

// Un code de cellule doit être unique à l'intérieur d'une province
celluleSchema.index(
  { provinceId: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: {
      code: { $exists: true, $type: 'string' },
    },
  }
);

// Index utiles pour le dashboard national
celluleSchema.index({ provinceId: 1, name: 1 });
celluleSchema.index({ provinceId: 1, status: 1 });
celluleSchema.index({ provinceId: 1, type: 1 });

module.exports = mongoose.model('Cellule', celluleSchema);