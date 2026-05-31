const prisma = require('../config/db');

// get tasks that are past their due date and not marked DONE
async function getOverdueTasks(orgId) {
  const overdueTasks = await prisma.task.findMany({
    where: {
      project: { orgId },
      dueDate: { lt: new Date() },
      NOT: { status: 'DONE' },
    },
    include: {
      assignee: {
        select: { id: true, email: true, name: true },
      },
      project: true,
    },
    orderBy: { dueDate: 'asc' },
  });

  return {
    count: overdueTasks.length,
    tasks: overdueTasks,
  };
}

// compute average completion time for completed tasks in the organization
async function getCompletionTimeStats(orgId) {
  const completedTasks = await prisma.task.findMany({
    where: {
      project: { orgId },
      status: 'DONE',
    },
  });

  if (completedTasks.length === 0) {
    return {
      count: 0,
      averageCompletionTimeInHours: 0,
    };
  }

  // calculate sum of durations in milliseconds
  const totalDurationMs = completedTasks.reduce((sum, task) => {
    const duration = task.updatedAt.getTime() - task.createdAt.getTime();
    return sum + duration;
  }, 0);

  const averageDurationMs = totalDurationMs / completedTasks.length;
  
  // convert milliseconds to hours
  const averageHours = averageDurationMs / (1000 * 60 * 60);

  return {
    count: completedTasks.length,
    averageCompletionTimeInHours: Math.round(averageHours * 100) / 100, // round to 2 decimal places
  };
}

module.exports = {
  getOverdueTasks,
  getCompletionTimeStats,
};
