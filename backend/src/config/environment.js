/**
 * Central Environment Validator
 * Validates critical environment variables at startup.
 */

const validateEnvironment = () => {
  // Validate JWT Secret
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    console.error('\n======================================================');
    console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
    console.error('The backend server cannot boot without a secure JWT Secret.');
    console.error('Please generate one using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.error('And place it in your .env file as JWT_SECRET=...');
    console.error('======================================================\n');
    process.exit(1);
  }
};

module.exports = {
  validateEnvironment,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development'
};
