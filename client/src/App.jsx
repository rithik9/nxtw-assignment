import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import api from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]); // list of real-time alerts

  // check if user already has an active session on boot
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // try to fetch projects to confirm token viability
          await api.getProjects();
          
          // parse token payload to construct user summary
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          // we need user profile details, let's build it from context
          setUser({
            id: payload.userId,
            role: payload.role,
            orgId: payload.orgId,
            name: 'Active User', // fallback name
          });
        } catch (err) {
          localStorage.removeItem('accessToken');
        }
      }
    };
    checkSession();
  }, []);

  // connect websockets for live task updates
  useEffect(() => {
    if (!user) return;

    let ws = null;
    let reconnectTimeout = null;

    const connectWS = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // during local dev we connect to port 8080 directly
      const wsUrl = `${wsProtocol}//127.0.0.1:8080?token=${token}`;
      
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          // push new toast alert
          const newToast = {
            id: Date.now(),
            title: payload.type.replace(/_/g, ' '),
            message: payload.message,
          };

          setToasts((prev) => [...prev, newToast]);

          // auto remove toast after 5 seconds
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
          }, 5000);
        } catch (err) {
          // silent ignore
        }
      };

      ws.onclose = () => {
        // attempt reconnection after 5 seconds
        reconnectTimeout = setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [user]);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setToasts([]);
  };

  return (
    <>
      {user ? (
        <DashboardPage user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={setUser} />
      )}

      {/* Real-time notification Toast board */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast glass-card">
            <span className="toast-title">{toast.title}</span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
