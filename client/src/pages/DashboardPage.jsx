import React, { useState, useEffect } from 'react';
import api from '../api';
import Header from '../components/Header';
import TaskList from '../components/TaskList';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import ProjectForm from '../components/ProjectForm';
import UserList from '../components/UserList';
import Button from '../components/Button';

const STATUS_COLUMNS = [
  { id: 'TODO', title: 'To Do', indicator: 'todo-indicator' },
  { id: 'IN_PROGRESS', title: 'In Progress', indicator: 'progress-indicator' },
  { id: 'IN_REVIEW', title: 'In Review', indicator: 'review-indicator' },
  { id: 'DONE', title: 'Completed', indicator: 'done-indicator' },
  { id: 'BLOCKED', title: 'Blocked', indicator: 'blocked-indicator' },
];

export default function DashboardPage({ user, onLogout }) {
  // states
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // modal states
  const [activeModal, setActiveModal] = useState(null); // 'task-create' | 'task-edit' | 'project-create' | 'users' | null
  const [selectedTask, setSelectedTask] = useState(null);

  // form inputs
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskProject, setTaskProject] = useState('');

  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  // data pools
  const [usersList, setUsersList] = useState([]);

  // analytics states
  const [overdueCount, setOverdueCount] = useState(0);
  const [completionStats, setCompletionStats] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // check if user is admin/manager
  const isElevated = user.role === 'ADMIN' || user.role === 'MANAGER';
  const isAdmin = user.role === 'ADMIN';

  // load projects, tasks, and core analytics on load
  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // fetch projects
      const loadedProjects = await api.getProjects();
      setProjects(loadedProjects);

      // fetch tasks with current filters
      const filterOptions = {};
      if (selectedProject !== 'all') filterOptions.projectId = selectedProject;
      if (selectedPriority !== 'all') filterOptions.priority = selectedPriority;

      const loadedTasks = await api.getTasks(filterOptions);
      setTasks(loadedTasks);

      // fetch users if elevated
      if (isElevated) {
        const loadedUsers = await api.getUsers();
        setUsersList(loadedUsers);

        // load analytics
        const overdueData = await api.getOverdueTasks();
        setOverdueCount(overdueData.count);

        const completionData = await api.getCompletionTimeStats();
        setCompletionStats(completionData);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load task board.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProject, selectedPriority]);

  // handle create project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.createProject(projectName, projectDesc);
      setProjectName('');
      setProjectDesc('');
      setActiveModal(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create project.');
    }
  };

  // handle create task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.createTask({
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        dueDate: taskDueDate || null,
        assigneeId: taskAssignee,
        projectId: taskProject,
      });

      // reset form
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('MEDIUM');
      setTaskDueDate('');
      setTaskAssignee('');
      setTaskProject('');
      
      setActiveModal(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create task.');
    }
  };

  // handle edit task submission
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await api.updateTask(selectedTask.id, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        dueDate: taskDueDate || null,
        assigneeId: taskAssignee,
        projectId: taskProject,
      });

      setActiveModal(null);
      setSelectedTask(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update task.');
    }
  };

  // handle task deletion
  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(selectedTask.id);
      setActiveModal(null);
      setSelectedTask(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  // handle fast status transition change via drag or select
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      loadData();
      
      // Update selected task reference if open in modal
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.message || 'Transition blocked by lifecycle business rules.');
    }
  };

  // handle role changes for users (admin only)
  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      await api.updateUserRole(targetUserId, newRole);
      // reload users pool
      const loadedUsers = await api.getUsers();
      setUsersList(loadedUsers);
    } catch (err) {
      alert(err.message || 'Failed to update user role.');
    }
  };

  // open edit modal with prefilled data
  const openEditModal = (task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setTaskAssignee(task.assigneeId || '');
    setTaskProject(task.projectId || '');
    setActiveModal('task-edit');
  };

  const openCreateModal = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskDueDate('');
    setTaskAssignee('');
    setTaskProject('');
    setActiveModal('task-create');
  };

  return (
    <div className="app-container">
      {/* Header element */}
      <Header
        title="TRACKER API"
        userName={user.name}
        userRole={user.role}
        isAdmin={isAdmin}
        onManageUsers={() => setActiveModal('users')}
        onLogout={onLogout}
      />

      <main className="dashboard-main">
        {/* Analytics strip (elevated only) */}
        {isElevated && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overdue Tasks</span>
              <span style={{ fontSize: '1.75rem', fontWeight: '700', color: overdueCount > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                {overdueCount}
              </span>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Completion Time</span>
              <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-info)' }}>
                {completionStats ? `${completionStats.averageCompletionTimeInHours} hours` : '0 hours'}
              </span>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization ID</span>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {user.orgId}
              </span>
            </div>
          </div>
        )}

        {errorMsg && <div className="form-error-msg">{errorMsg}</div>}

        {/* Filters and Actions */}
        <div className="dashboard-toolbar">
          <div className="filter-group">
            <select className="select-input" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select className="select-input" value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {isElevated && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button
                label="+ Project"
                variant="secondary"
                onClick={() => setActiveModal('project-create')}
              />
              <Button
                label="+ Task"
                variant="primary"
                onClick={openCreateModal}
              />
            </div>
          )}
        </div>

        {/* Task Board Kanban display */}
        {loading && tasks.length === 0 ? (
          <div style={{ textAlign: 'center', margin: '4rem 0', color: 'var(--text-secondary)' }}>Loading task board...</div>
        ) : (
          <div className="board-container">
            {STATUS_COLUMNS.map((column) => (
              <TaskList
                key={column.id}
                title={column.title}
                tasks={tasks.filter((t) => t.status === column.id)}
                indicatorClass={column.indicator}
                onTaskClick={openEditModal}
              />
            ))}
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* Project Creation Modal */}
      <Modal
        isOpen={activeModal === 'project-create'}
        title="New Project"
        onClose={() => setActiveModal(null)}
      >
        <ProjectForm
          projectName={projectName}
          setProjectName={setProjectName}
          projectDesc={projectDesc}
          setProjectDesc={setProjectDesc}
          onSubmit={handleCreateProject}
          onCancel={() => setActiveModal(null)}
        />
      </Modal>

      {/* Task Creation Modal */}
      <Modal
        isOpen={activeModal === 'task-create'}
        title="Create Task"
        onClose={() => setActiveModal(null)}
      >
        <TaskForm
          isEdit={false}
          projects={projects}
          usersList={usersList}
          isElevated={isElevated}
          currentUser={user}
          taskTitle={taskTitle}
          setTaskTitle={setTaskTitle}
          taskDesc={taskDesc}
          setTaskDesc={setTaskDesc}
          taskPriority={taskPriority}
          setTaskPriority={setTaskPriority}
          taskDueDate={taskDueDate}
          setTaskDueDate={setTaskDueDate}
          taskProject={taskProject}
          setTaskProject={setTaskProject}
          taskAssignee={taskAssignee}
          setTaskAssignee={setTaskAssignee}
          onSubmit={handleCreateTask}
          onCancel={() => setActiveModal(null)}
        />
      </Modal>

      {/* Task Edit / Status transition Modal */}
      <Modal
        isOpen={activeModal === 'task-edit' && !!selectedTask}
        title="Task Details"
        onClose={() => { setActiveModal(null); setSelectedTask(null); }}
      >
        <TaskForm
          isEdit={true}
          projects={projects}
          usersList={usersList}
          isElevated={isElevated}
          currentUser={user}
          selectedTask={selectedTask}
          taskTitle={taskTitle}
          setTaskTitle={setTaskTitle}
          taskDesc={taskDesc}
          setTaskDesc={setTaskDesc}
          taskPriority={taskPriority}
          setTaskPriority={setTaskPriority}
          taskDueDate={taskDueDate}
          setTaskDueDate={setTaskDueDate}
          taskProject={taskProject}
          setTaskProject={setTaskProject}
          taskAssignee={taskAssignee}
          setTaskAssignee={setTaskAssignee}
          onSubmit={handleUpdateTask}
          onCancel={() => { setActiveModal(null); setSelectedTask(null); }}
          onDelete={handleDeleteTask}
          onStatusChange={handleStatusChange}
        />
      </Modal>

      {/* User Management Modal (Admins only) */}
      <Modal
        isOpen={activeModal === 'users' && isAdmin}
        title="Organization User Directory"
        onClose={() => setActiveModal(null)}
      >
        <UserList
          usersList={usersList}
          currentUser={user}
          onRoleChange={handleRoleChange}
        />
        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
          <Button label="Done" onClick={() => setActiveModal(null)} />
        </div>
      </Modal>
    </div>
  );
}

