import mongoose from 'mongoose';

async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI est obligatoire');
  await mongoose.connect(uri);
  console.log('Connexion MongoDB etablie');
}

export default connectDatabase;
