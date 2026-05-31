// API Client to interface with our Express/Prisma backend
// Handled cleanly via Vite's configured port proxy

async function request(url, options = {}) {
  const headers = new Headers(options.headers || {});
  
  // automatically append json content headers if sending a body
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    if (typeof options.body !== 'string') {
      options.body = JSON.stringify(options.body);
    }
  }

  // append authorization token if present in memory
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });
  
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data?.message || 'An unexpected request error occurred.';
    const errorCode = data?.code || 'API_ERROR';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.code = errorCode;
    throw error;
  }

  return data;
}

// Authentication requests
async function login(email, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  
  if (res.data?.accessToken) {
    localStorage.setItem('accessToken', res.data.accessToken);
  }
  return res.data;
}

async function register(name, email, password, orgOption) {
  const body = { name, email, password };
  if (orgOption.orgId) {
    body.orgId = orgOption.orgId;
  } else {
    body.orgName = orgOption.orgName;
  }

  return request('/api/auth/register', {
    method: 'POST',
    body,
  });
}

async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    // proceed anyway to clean local storage
  }
  localStorage.removeItem('accessToken');
}

async function refreshTokens() {
  const res = await request('/api/auth/refresh', { method: 'POST' });
  if (res.data?.accessToken) {
    localStorage.setItem('accessToken', res.data.accessToken);
  }
  return res.data?.accessToken;
}

// User role management (Admins)
async function getUsers() {
  const res = await request('/api/users');
  return res.data.users;
}

async function updateUserRole(userId, role) {
  const res = await request(`/api/users/${userId}/role`, {
    method: 'PATCH',
    body: { role },
  });
  return res.data.user;
}

// Project management
async function getProjects() {
  const res = await request('/api/projects');
  return res.data.projects;
}

async function createProject(name, description) {
  const res = await request('/api/projects', {
    method: 'POST',
    body: { name, description },
  });
  return res.data.project;
}

// Task management
async function getTasks(filters = {}) {
  const queryParams = new URLSearchParams();
  if (filters.projectId) queryParams.append('projectId', filters.projectId);
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.priority) queryParams.append('priority', filters.priority);

  const url = `/api/tasks?${queryParams.toString()}`;
  const res = await request(url);
  return res.data.tasks;
}

async function createTask(taskData) {
  const res = await request('/api/tasks', {
    method: 'POST',
    body: taskData,
  });
  return res.data.task;
}

async function updateTask(taskId, taskData) {
  const res = await request(`/api/tasks/${taskId}`, {
    method: 'PUT',
    body: taskData,
  });
  return res.data.task;
}

async function updateTaskStatus(taskId, status) {
  const res = await request(`/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: { status },
  });
  return res.data.task;
}

async function deleteTask(taskId) {
  return request(`/api/tasks/${taskId}`, { method: 'DELETE' });
}

// Analytics (Admins & Managers)
async function getOverdueTasks() {
  const res = await request('/api/analytics/overdue');
  return res.data;
}

async function getCompletionTimeStats() {
  const res = await request('/api/analytics/completion-time');
  return res.data;
}

export default {
  login,
  register,
  logout,
  refreshTokens,
  getUsers,
  updateUserRole,
  getProjects,
  createProject,
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getOverdueTasks,
  getCompletionTimeStats,
};
