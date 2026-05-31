import React from 'react';
import Button from './Button';

export default function LoginForm({
  onSubmit,
  error,
  loading,
  isRegister,
  setIsRegister,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  orgOption,
  setOrgOption,
  orgId,
  setOrgId,
  orgName,
  setOrgName,
  clearError,
}) {
  return (
    <div className="login-card glass-card">
      <div className="login-title-group">
        <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
        <p>{isRegister ? 'Sign up to start tracking your team tasks' : 'Enter your credentials to access your task board'}</p>
      </div>

      {error && <div className="form-error-msg">{error}</div>}

      <form onSubmit={onSubmit}>
        {isRegister && (
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@email.com"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 characters)"
            required
          />
        </div>

        {isRegister && (
          <div className="form-group">
            <label className="form-label">Organization Setup</label>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="orgOption"
                  value="existing"
                  checked={orgOption === 'existing'}
                  onChange={() => setOrgOption('existing')}
                />
                Join Existing
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="orgOption"
                  value="new"
                  checked={orgOption === 'new'}
                  onChange={() => setOrgOption('new')}
                />
                Create New
              </label>
            </div>

            {orgOption === 'existing' ? (
              <input
                className="form-input"
                type="text"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                placeholder="Paste Organization ID"
                required
              />
            ) : (
              <input
                className="form-input"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="My Brand New Organization"
                required
              />
            )}
          </div>
        )}

        <Button
          label={loading ? 'Please wait...' : isRegister ? 'Register & Login' : 'Login'}
          type="submit"
          disabled={loading}
          style={{ width: '100%', marginTop: '1.5rem' }}
        />
      </form>

      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
        </span>
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            if (clearError) clearError();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: 'var(--font-family)',
          }}
        >
          {isRegister ? 'Log In' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}
