const projectService = require('../services/project.service');

async function createProject(req, res, next) {
  try {
    const project = await projectService.createProject(req.body, req.user.orgId);
    res.status(201).json({
      status: 201,
      message: 'Project created successfully.',
      data: { project },
    });
  } catch (err) {
    next(err);
  }
}

async function getProjects(req, res, next) {
  try {
    const projects = await projectService.getProjects(req.user.orgId);
    res.status(200).json({
      status: 200,
      data: { projects },
    });
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user.orgId);
    res.status(200).json({
      status: 200,
      data: { project },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    await projectService.deleteProject(req.params.id, req.user.orgId);
    res.status(200).json({
      status: 200,
      message: 'Project deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  deleteProject,
};
