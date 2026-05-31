import React from 'react';

export default function UserList({
  usersList = [],
  currentUser = {},
  onRoleChange,
}) {
  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {usersList.map((u) => (
        <div 
          key={u.id} 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '0.75rem 1rem', 
            background: 'rgba(0, 0, 0, 0.2)', 
            borderRadius: '8px',
            border: '1px solid var(--border-glass)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            <span style={{ fontWeight: '600' }}>{u.name}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</span>
          </div>

          {/* prevent admin from demoting themselves */}
          {u.id === currentUser.id ? (
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)' }}>{u.role} (YOU)</span>
          ) : (
            <select
              className="select-input"
              value={u.role}
              onChange={(e) => onRoleChange(u.id, e.target.value)}
            >
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="MEMBER">Member</option>
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
