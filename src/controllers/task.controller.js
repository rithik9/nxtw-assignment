const taskService = require('../services/task.service');

async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.body, req.user.orgId);
    res.status(201).json({
      status: 201,
      message: 'Task created successfully.',
      data: { task },
    });
  } catch (err) {
    next(err);
  }
}

async function getTasks(req, res, next) {
  try {
    const tasks = await taskService.getTasks(req.query, req.user);
    res.status(200).json({
      status: 200,
      data: { tasks },
    });
  } catch (err) {
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user);
    res.status(200).json({
      status: 200,
      data: { task },
    });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user);
    res.status(200).json({
      status: 200,
      message: 'Task updated successfully.',
      data: { task },
    });
  } catch (err) {
    next(err);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const { status } = req.body;
    const task = await taskService.updateTaskStatus(req.params.id, status, req.user);
    res.status(200).json({
      status: 200,
      message: 'Task status updated successfully.',
      data: { task },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.params.id, req.user.orgId);
    res.status(200).json({
      status: 200,
      message: 'Task deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
