const prisma = require('../config/db');
const { AppError, ErrorCodes } = require('../constants/errors');
const Transitions = require('../constants/transitions');

// create a new task in a project under the organization
async function createTask(data, orgId) {
  const { title, description, priority, dueDate, assigneeId, projectId } = data;

  // confirm project belongs to the organization
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project || project.orgId !== orgId) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'The specified project was not found.');
  }

  // confirm assignee belongs to the organization
  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
  });
  if (!assignee || assignee.orgId !== orgId) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'The specified assignee was not found in your organization.');
  }

  return prisma.task.create({
    data: {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId,
      projectId,
      status: 'TODO', // all tasks start in TODO state
    },
    include: {
      assignee: {
        select: { id: true, email: true, name: true, role: true },
      },
      project: true,
    },
  });
}

// fetch tasks, enforcing role boundaries and organization isolation
async function getTasks(filters, user) {
  const { projectId, status, priority } = filters;
  
  const whereClause = {
    project: { orgId: user.orgId },
  };

  // MEMBERS can only see tasks assigned to them
  if (user.role === 'MEMBER') {
    whereClause.assigneeId = user.id;
  }

  if (projectId) {
    whereClause.projectId = projectId;
  }

  if (status) {
    whereClause.status = status;
  }

  if (priority) {
    whereClause.priority = priority;
  }

  return prisma.task.findMany({
    where: whereClause,
    include: {
      assignee: {
        select: { id: true, email: true, name: true, role: true },
      },
      project: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// retrieve a single task by ID with access boundary checks
async function getTaskById(taskId, user) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        select: { id: true, email: true, name: true, role: true },
      },
      project: true,
    },
  });

  if (!task || task.project.orgId !== user.orgId) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'The task was not found.');
  }

  // MEMBER role isolation check
  if (user.role === 'MEMBER' && task.assigneeId !== user.id) {
    throw new AppError(403, ErrorCodes.FORBIDDEN, 'You do not have permission to access this task.');
  }

  return task;
}

// full task details update
async function updateTask(taskId, data, user) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task || task.project.orgId !== user.orgId) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'The task was not found.');
  }

  // only assignees or admin/managers can update tasks
  if (user.role === 'MEMBER' && task.assigneeId !== user.id) {
    throw new AppError(403, ErrorCodes.FORBIDDEN, 'You do not have permission to update this task.');
  }

  const { title, description, priority, status, dueDate, assigneeId, projectId } = data;
  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (priority !== undefined) updateData.priority = priority;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

  if (projectId !== undefined) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.orgId !== user.orgId) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'The project was not found.');
    }
    updateData.projectId = projectId;
  }

  if (assigneeId !== undefined) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!assignee || assignee.orgId !== user.orgId) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'The assignee was not found in your organization.');
    }
    updateData.assigneeId = assigneeId;
  }

  if (status !== undefined && status !== task.status) {
    const validNextStates = Transitions[task.status] || [];
    if (!validNextStates.includes(status)) {
      throw new AppError(400, ErrorCodes.INVALID_TRANSITION, `Cannot transition task from ${task.status} to ${status}.`);
    }
    updateData.status = status;
  }

  return prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignee: {
        select: { id: true, email: true, name: true, role: true },
      },
      project: true,
    },
  });
}

// update status only, enforcing business logic transitions
async function updateTaskStatus(taskId, status, user) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task || task.project.orgId !== user.orgId) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'The task was not found.');
  }

  // assignee, manager or admin can update status
  if (user.role === 'MEMBER' && task.assigneeId !== user.id) {
    throw new AppError(403, ErrorCodes.FORBIDDEN, 'You do not have permission to update the status of this task.');
  }

  if (status !== task.status) {
    const validNextStates = Transitions[task.status] || [];
    if (!validNextStates.includes(status)) {
      throw new AppError(400, ErrorCodes.INVALID_TRANSITION, `Cannot transition task from ${task.status} to ${status}.`);
    }
  }

  return prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: {
      assignee: {
        select: { id: true, email: true, name: true, role: true },
      },
      project: true,
    },
  });
}

// delete a task
async function deleteTask(taskId, orgId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task || task.project.orgId !== orgId) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'The task was not found.');
  }

  await prisma.task.delete({
    where: { id: taskId },
  });
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
