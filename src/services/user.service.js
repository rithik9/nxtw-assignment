const prisma = require('../config/db');
const { AppError, ErrorCodes } = require('../constants/errors');

// fetch all users belonging to the same organization
async function getUsers(orgId) {
  return prisma.user.findMany({
    where: { orgId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
}

// update a user's role, enforcing org boundary security
async function updateUserRole(targetUserId, requesterOrgId, newRole) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  // check if user exists and belongs to the same org
  if (!user || user.orgId !== requesterOrgId) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'The specified user was not found in your organization.');
  }

  // update the role
  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return updatedUser;
}

module.exports = {
  getUsers,
  updateUserRole,
};
