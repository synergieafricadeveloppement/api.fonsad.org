// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    level: {
      type: String,
      enum: ['national', 'province', 'cellule', 'departement'],
      default: 'cellule',
    },
    department: {
      type: String,
      enum: [
        'rh',
        'finances',
        'formations',
        'adhesion',
        'coordination',
        'secretariat',
        'autre',
      ],
      default: 'adhesion',
    },
    role: {
      type: String,
      enum: [
        'super_admin',
        'admin_national',
        'admin_province',
        'admin_cellule',
        'chef_departement',
        'agent_rh',
        'agent_finances',
        'agent_formations',
        'membre',
        'adherent',
      ],
      default: 'adherent',
    },
    memberType: {
      type: String,
      enum: ['standard', 'honneur'],
      default: 'standard',
      index: true,
    },
    provinceName: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    celluleName: {
      type: String,
      trim: true,
      default: '',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);