// backend/scripts/migrate-add-memberType-to-users.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const result = await User.updateMany(
    { memberType: { $exists: false } },
    { $set: { memberType: 'standard' } }
  );

  console.log('Migration terminée.');
  console.log('matchedCount =', result.matchedCount);
  console.log('modifiedCount =', result.modifiedCount);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Erreur migration memberType:', error);
  await mongoose.disconnect();
  process.exit(1);
});