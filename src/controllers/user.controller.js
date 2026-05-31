const userService = require('../services/user.service');

// fetch list of users in the organization
async function getUsers(req, res, next) {
  try {
    const users = await userService.getUsers(req.user.orgId);
    res.status(200).json({
      status: 200,
      data: { users },
    });
  } catch (err) {
    next(err);
  }
}

// update a user's role
async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const updatedUser = await userService.updateUserRole(id, req.user.orgId, role);

    res.status(200).json({
      status: 200,
      message: 'User role updated successfully.',
      data: { user: updatedUser },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  updateUserRole,
};
