import React, { useState } from 'react';
import api from '../api';
import LoginForm from '../components/LoginForm';

export default function LoginPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  
  // form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgOption, setOrgOption] = useState('existing'); // 'existing' | 'new'
  const [orgId, setOrgId] = useState('');
  const [orgName, setOrgName] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // register flow
        const orgSelect = orgOption === 'existing' ? { orgId } : { orgName };
        await api.register(name, email, password, orgSelect);
        
        // auto login after successful register
        const loginData = await api.login(email, password);
        onLoginSuccess(loginData.user);
      } else {
        // login flow
        const loginData = await api.login(email, password);
        onLoginSuccess(loginData.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <LoginForm
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
        isRegister={isRegister}
        setIsRegister={setIsRegister}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        name={name}
        setName={setName}
        orgOption={orgOption}
        setOrgOption={setOrgOption}
        orgId={orgId}
        setOrgId={setOrgId}
        orgName={orgName}
        setOrgName={setOrgName}
        clearError={() => setError(null)}
      />
    </div>
  );
}

