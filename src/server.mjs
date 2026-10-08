import dotenv from 'dotenv';
dotenv.config();
import app from './app.mjs';
import connectDatabase from './config/database.mjs';

const port = Number(process.env.PORT) || 3000;
connectDatabase()
  .then(() => app.listen(port, () => console.log(`API disponible sur le port ${port}`)))
  .catch((error) => {
    console.error('Demarrage impossible :', error.message);
    process.exitCode = 1;
  });
