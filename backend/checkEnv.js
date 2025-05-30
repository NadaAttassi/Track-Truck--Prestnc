require('dotenv').config();

const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET'
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing environment variable: ${varName}`);
    process.exit(1);
  }
});

console.log('All required environment variables are present');
