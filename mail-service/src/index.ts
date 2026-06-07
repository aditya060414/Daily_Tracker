import express from 'express';
import dotenv from 'dotenv';
import { startConnection } from './consumer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Start the RabbitMQ consumer connection
startConnection();

app.listen(PORT, () => {
  console.log(`Mail service is listening on port ${PORT}`);
});
