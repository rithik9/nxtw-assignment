const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { AppError, ErrorCodes } = require('../constants/errors');

// register a new user under a new or existing org
async function register(data) {
  const { email, password, name, orgId, orgName } = data;
  const normalizedEmail = email.toLowerCase().trim();

  // check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    throw new AppError(409, ErrorCodes.CONFLICT, 'An account with this email address already exists.');
  }

  let finalOrgId = orgId;

  // either find org or create a new one
  if (orgName) {
    const newOrg = await prisma.organization.create({
      data: { name: orgName },
    });
    finalOrgId = newOrg.id;
  } else {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'The specified organization does not exist.');
    }
  }

  const hashedPassword = await hashPassword(password);

  // create user record
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name,
      orgId: finalOrgId,
      role: 'MEMBER', // new signups are always members by default
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    orgId: user.orgId,
    role: user.role,
  };
}

// verify user credentials and generate tokens
async function login(email, password) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user) {
    throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid email or password.');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid email or password.');
  }

  // issue access and refresh tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    orgId: user.orgId,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  // persist the refresh token in the db
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: user.orgId,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

// rotate access and refresh tokens, detecting any replay abuse
async function refresh(oldToken) {
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: true },
  });

  if (!tokenRecord) {
    throw new AppError(401, ErrorCodes.INVALID_TOKEN, 'Invalid refresh token.');
  }

  // if the token was already revoked, we've got a replay attack!
  if (tokenRecord.revoked) {
    // revoke all existing refresh tokens for this user as a safety measure
    await prisma.refreshToken.updateMany({
      where: { userId: tokenRecord.userId },
      data: { revoked: true },
    });
    throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Security alert: Refresh token has already been used.');
  }

  // verify expiration
  if (tokenRecord.expiresAt < new Date()) {
    throw new AppError(401, ErrorCodes.TOKEN_EXPIRED, 'Refresh token has expired.');
  }

  // generate new pair
  const accessToken = generateAccessToken({
    userId: tokenRecord.user.id,
    role: tokenRecord.user.role,
    orgId: tokenRecord.user.orgId,
  });

  const newRefreshToken = generateRefreshToken({
    userId: tokenRecord.userId,
  });

  // revoke the old token
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revoked: true },
  });

  // store the new refresh token
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: tokenRecord.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

// revoke the refresh token to log out the user
async function logout(token) {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
