import dotenv from 'dotenv';

// Load test environment before importing app
dotenv.config({ path: '.env.test' });

// Now import the app
import app from '../../index.js';

export default app;
