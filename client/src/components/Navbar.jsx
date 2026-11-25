import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket, useSocketEvent } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import { Logo } from './ui';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  const loadPending = useCallback(() => {
    if (user?.role !== 'admin') {
      setPending(0);
      return;
    }
    api('/admin/campaigns?status=pending')
      .then((d) => setPending(d.summary.pending))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);
  useSocketEvent('campaign:pending', (c) => {
    if (user?.role === 'admin') {
      toast.info(`New campaign waiting for review: ${c.title}`);
      loadPending();
    }
  });
  useSocketEvent('campaign:status', loadPending);

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" aria-label="FundRaise home">
          <Logo id="lg-nav" />
          <span>FundRaise</span>
        </Link>

        <button className="nav-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/explore">Explore</NavLink>
          {user?.role === 'creator' && (
            <>
              <NavLink to="/dashboard">My campaigns</NavLink>
              <NavLink to="/campaigns/new">Start a campaign</NavLink>
            </>
          )}
          {user?.role === 'supporter' && <NavLink to="/my-pledges">My pledges</NavLink>}
          {user?.role === 'admin' && (
            <NavLink to="/admin">
              Review
              {pending > 0 && <span className="nav-count">{pending}</span>}
            </NavLink>
          )}

          <span className={`live-dot ${connected ? 'on' : ''}`} title={connected ? 'Live updates on' : 'Reconnecting…'}>
            <i />
            {connected ? 'Live' : 'Offline'}
          </span>

          {user ? (
            <div className="nav-user">
              <span className="avatar" aria-hidden="true">
                {user.name[0].toUpperCase()}
              </span>
              <div>
                <strong>{user.name}</strong>
                <small>{user.role}</small>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
