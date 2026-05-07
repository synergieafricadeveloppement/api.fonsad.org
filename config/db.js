const mongoose = require('mongoose');

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI manquant dans le fichier .env');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connecté');
}

module.exports = connectDB;