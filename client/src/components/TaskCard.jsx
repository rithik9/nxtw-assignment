import React from 'react';

export default function TaskCard({ task, onClick }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div className="task-card glass-card" onClick={() => onClick(task)}>
      <div className="task-card-header">
        <span className="task-title">{task.title}</span>
        <span className={`priority-badge priority-${task.priority}`}>
          {task.priority}
        </span>
      </div>

      {task.description && <p className="task-card-desc">{task.description}</p>}

      <div className="task-card-footer">
        <div className="assignee-avatar">
          <div className="avatar-circle">
            {task.assignee ? task.assignee.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="assignee-name">{task.assignee ? task.assignee.name : 'Unassigned'}</span>
        </div>

        {task.dueDate && (
          <span className={`due-date-display ${isOverdue ? 'overdue' : ''}`}>
            {isOverdue ? 'Overdue' : new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
