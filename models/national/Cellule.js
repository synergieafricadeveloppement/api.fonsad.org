// backend/models/national/Cellule.js

const mongoose = require('mongoose');

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
    photoUrl: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const celluleSchema = new mongoose.Schema(
  {
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
    },

    zone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
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

    description: {
      type: String,
      trim: true,
    },

    responsable: {
      type: responsableSchema,
      required: false,
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
    },

    updatedBy: {
      type: String,
      trim: true,
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