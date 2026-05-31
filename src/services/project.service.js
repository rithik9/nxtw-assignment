const prisma = require('../config/db');
const { AppError, ErrorCodes } = require('../constants/errors');

// create a new project in the organization
async function createProject(data, orgId) {
  const { name, description } = data;

  return prisma.project.create({
    data: {
      name,
      description,
      orgId,
    },
  });
}

// retrieve all projects in the organization
async function getProjects(orgId) {
  return prisma.project.findMany({
    where: { orgId },
  });
}

// get details of a specific project, verifying org boundary
async function getProjectById(projectId, orgId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.orgId !== orgId) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'The project was not found.');
  }

  return project;
}

// delete a project, confirming ownership
async function deleteProject(projectId, orgId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.orgId !== orgId) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'The project was not found.');
  }

  // cascade delete tasks inside this project automatically
  await prisma.task.deleteMany({
    where: { projectId },
  });

  await prisma.project.delete({
    where: { id: projectId },
  });
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  deleteProject,
};
