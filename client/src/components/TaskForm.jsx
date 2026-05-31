import React from 'react';
import Button from './Button';

export default function TaskForm({
  isEdit = false,
  projects = [],
  usersList = [],
  isElevated = false,
  currentUser = {},
  selectedTask = null,
  taskTitle,
  setTaskTitle,
  taskDesc,
  setTaskDesc,
  taskPriority,
  setTaskPriority,
  taskDueDate,
  setTaskDueDate,
  taskProject,
  setTaskProject,
  taskAssignee,
  setTaskAssignee,
  onSubmit,
  onCancel,
  onDelete,
  onStatusChange,
}) {
  const canEditFields = isElevated || (selectedTask && selectedTask.assigneeId === currentUser.id);

  return (
    <div>
      {/* Quick status transition bar in edit mode */}
      {isEdit && selectedTask && (
        <div style={{ marginBottom: '1.5rem', background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <label className="form-label">Task Status</label>
          <select 
            className="select-input" 
            style={{ width: '100%', marginTop: '0.25rem' }} 
            value={selectedTask.status} 
            onChange={(e) => onStatusChange(selectedTask.id, e.target.value)}
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="task-title">Title</label>
          <input
            id="task-title"
            className="form-input"
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            disabled={isEdit && !canEditFields}
            placeholder="Write documentation"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="task-desc">Description</label>
          <textarea
            id="task-desc"
            className="form-input"
            style={{ minHeight: '80px', resize: 'vertical' }}
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            disabled={isEdit && !canEditFields}
            placeholder="Task details..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="task-pri">Priority</label>
            <select 
              id="task-pri" 
              className="select-input" 
              style={{ width: '100%' }} 
              value={taskPriority} 
              onChange={(e) => setTaskPriority(e.target.value)}
              disabled={isEdit && !canEditFields}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="task-due">Due Date</label>
            <input
              id="task-due"
              className="form-input"
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              disabled={isEdit && !canEditFields}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="task-project">Project</label>
          <select 
            id="task-project" 
            className="select-input" 
            style={{ width: '100%' }} 
            value={taskProject} 
            onChange={(e) => setTaskProject(e.target.value)} 
            disabled={isEdit && !isElevated}
            required
          >
            {!isEdit && <option value="">Select Project</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="task-user">Assignee</label>
          <select 
            id="task-user" 
            className="select-input" 
            style={{ width: '100%' }} 
            value={taskAssignee} 
            onChange={(e) => setTaskAssignee(e.target.value)} 
            disabled={isEdit && !isElevated}
            required
          >
            {!isEdit && <option value="">Assign To</option>}
            {isElevated ? (
              usersList.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))
            ) : (
              selectedTask && selectedTask.assignee ? (
                <option value={selectedTask.assignee.id}>{selectedTask.assignee.name}</option>
              ) : (
                <option value="">Unassigned</option>
              )
            )}
          </select>
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          {isEdit && isElevated ? (
            <Button
              label="Delete"
              variant="danger"
              onClick={onDelete}
            />
          ) : <div />}
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              label="Cancel"
              variant="secondary"
              onClick={onCancel}
            />
            <Button
              label={isEdit ? 'Save Changes' : 'Create Task'}
              variant="primary"
              type="submit"
              disabled={isEdit && !canEditFields}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
