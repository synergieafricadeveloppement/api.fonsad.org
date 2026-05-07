const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config();

async function seedNationalAccount() {
  try {
    await connectDB();

    const email = 'national@fonsad.org';

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('Le compte national existe déjà.');
      process.exit(0);
    }

    const user = await User.create({
      firstName: 'Admin',
      lastName: 'National',
      email: 'national@fonsad.org',
      phone: '+243000000001',
      password: 'fonsad@2026',
      level: 'national',
      department: 'coordination',
      role: 'super_admin',
      provinceName: 'Kinshasa',
      celluleName: 'National',
      emailVerified: true,
      isActive: true,
    });

    console.log('Compte national seedé avec succès.');
    console.log({
      id: user._id,
      email: user.email,
      level: user.level,
      department: user.department,
      role: user.role,
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur seed compte national:', error.message);
    process.exit(1);
  }
}

seedNationalAccount();