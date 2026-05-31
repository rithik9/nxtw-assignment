const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// simple wrapper to hash a password
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// verify a password matches the hash
async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword,
};
