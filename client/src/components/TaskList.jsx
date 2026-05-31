import React from 'react';
import TaskCard from './TaskCard';

export default function TaskList({ title, tasks, indicatorClass, onTaskClick }) {
  return (
    <div className="board-column">
      <div className="column-header">
        <div className="column-title-wrap">
          <span className={`column-indicator ${indicatorClass}`}></span>
          <span className="column-title">{title}</span>
        </div>
        <span className="column-count">{tasks.length}</span>
      </div>

      <div className="column-tasks-list">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
}
