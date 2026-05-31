const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// secure resolution: check env, then file, then generate ephemeral fallback
function getSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  
  const filePath = path.join(process.cwd(), 'jwt_secret.txt');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8').trim();
  }

  // TODO(security): in production we must throw or load from a secure KMS
  console.warn('Generating ephemeral JWT secret. Warning: this will invalidate sessions on restart!');
  const ephemeralSecret = crypto.randomBytes(32).toString('hex');
  
  // let's try to write it to a local file so it persists between dev reloads
  try {
    fs.writeFileSync(filePath, ephemeralSecret, { mode: 0o600 });
  } catch (err) {
    // ignore if we can't write, we'll just use the in-memory fallback
  }
  
  return ephemeralSecret;
}

const JWT_SECRET = getSecret();

// access tokens expire in 15 mins
function generateAccessToken(payload) {
  const uniquePayload = {
    ...payload,
    jti: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
  };
  return jwt.sign(uniquePayload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
}

// refresh tokens expire in 7 days
function generateRefreshToken(payload) {
  const uniquePayload = {
    ...payload,
    jti: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
  };
  return jwt.sign(uniquePayload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

// verify access token using hardcoded HS256 algorithm
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (err) {
    return null;
  }
}

// verify refresh token using hardcoded HS256 algorithm
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
