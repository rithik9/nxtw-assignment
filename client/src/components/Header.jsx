import React from 'react';
import Button from './Button';

export default function Header({ title, userName, userRole, isAdmin, onManageUsers, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-logo">{title}</div>
      <div className="header-actions">
        {isAdmin && onManageUsers && (
          <Button
            label="Manage Users"
            variant="secondary"
            onClick={onManageUsers}
          />
        )}
        <div className="user-profile-summary">
          <span className="profile-name">{userName}</span>
          <span className="profile-role">{userRole}</span>
        </div>
        <Button
          label="Logout"
          variant="danger"
          onClick={onLogout}
        />
      </div>
    </header>
  );
}
