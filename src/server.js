require('dotenv').config();
const app = require('./app');
const connectDatabase = require('./config/database');

const port = Number(process.env.PORT) || 3000;
connectDatabase()
  .then(() => app.listen(port, () => console.log(`API disponible sur le port ${port}`)))
  .catch((error) => {
    console.error('Demarrage impossible :', error.message);
    process.exitCode = 1;
  });
