const analyticsService = require('../services/analytics.service');

// handler for overdue tasks list
async function getOverdueTasks(req, res, next) {
  try {
    const data = await analyticsService.getOverdueTasks(req.user.orgId);
    res.status(200).json({
      status: 200,
      data,
    });
  } catch (err) {
    next(err);
  }
}

// handler for average completion time stats
async function getCompletionTimeStats(req, res, next) {
  try {
    const data = await analyticsService.getCompletionTimeStats(req.user.orgId);
    res.status(200).json({
      status: 200,
      data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverdueTasks,
  getCompletionTimeStats,
};
