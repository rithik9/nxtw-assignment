import React from 'react';
import Button from './Button';

export default function ProjectForm({
  projectName,
  setProjectName,
  projectDesc,
  setProjectDesc,
  onSubmit,
  onCancel,
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="proj-name">Project Name</label>
        <input
          id="proj-name"
          className="form-input"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="UI Redesign Project"
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="proj-desc">Description</label>
        <textarea
          id="proj-desc"
          className="form-input"
          style={{ minHeight: '100px', resize: 'vertical' }}
          value={projectDesc}
          onChange={(e) => setProjectDesc(e.target.value)}
          placeholder="Brief project details..."
        />
      </div>
      <div className="modal-actions">
        <Button
          label="Cancel"
          variant="secondary"
          onClick={onCancel}
        />
        <Button
          label="Create Project"
          variant="primary"
          type="submit"
        />
      </div>
    </form>
  );
}
