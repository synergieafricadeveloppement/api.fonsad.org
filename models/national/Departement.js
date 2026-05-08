// backend/models/national/Departement.js

const mongoose = require('mongoose');

const responsableSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      default: '',
    },
    fonction: {
      type: String,
      trim: true,
      default: 'Chef du département',
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
  { _id: false }
);

const membreSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      default: '',
    },
    fonction: {
      type: String,
      trim: true,
      default: 'Membre',
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
      default: '',
    },

    type: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    responsable: {
      type: responsableSchema,
      default: () => ({}),
    },

    membres: {
      type: [membreSchema],
      default: [],
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

departementSchema.virtual('id').get(function getId() {
  return this._id?.toString?.();
});

departementSchema.index(
  { celluleId: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: {
      code: { $exists: true, $type: 'string' },
    },
  }
);

departementSchema.index({ provinceId: 1, celluleId: 1, name: 1 });
departementSchema.index({ provinceId: 1, celluleId: 1, status: 1 });

module.exports = mongoose.model('Departement', departementSchema);