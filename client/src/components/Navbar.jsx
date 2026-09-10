import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Vote, BarChart3, Settings, Clock, UserCheck, Lock, CheckCircle2, Users, LogOut } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pollStatus, setPollStatus] = useState({ isOpen: true, status: 'POLLS_OPEN', reason: 'Polls are OPEN' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    // Clock ticker
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check admin authentication session on location change
    const checkAuth = () => {
      // Admin session is strictly active ONLY when user is currently inside the admin workspace
      const isAdminWorkspace = 
        location.pathname.startsWith('/admin/dashboard') ||
        location.pathname.startsWith('/admin/register-voter') ||
        location.pathname.startsWith('/admin/candidates');

      if (!isAdminWorkspace) {
        setAdminUser(null);
        return;
      }

      try {
        const s = sessionStorage.getItem('activeAdminSession');
        if (s) {
          const parsed = JSON.parse(s);
          if (parsed && parsed.success && parsed.token && parsed.user?.username === 'parthasarathi') {
            setAdminUser(parsed.user);
            return;
          }
        }
      } catch {
        // ignore JSON parse error
      }
      setAdminUser(null);
    };
    checkAuth();
  }, [location.pathname]);

  useEffect(() => {
    // Fetch election poll status
    const fetchStatus = async () => {
      try {
        const res = await api.getElectionConfig();
        if (res?.status) {
          setPollStatus(res.status);
        }
      } catch (err) {
        console.warn('Could not fetch poll status:', err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminSession');
    sessionStorage.removeItem('activeAdminSession');
    setAdminUser(null);
    navigate('/admin/login');
  };


  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-navy-900/80 border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Left: Brand Identity */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-cyber-cyan/20 to-cyber-emerald/20 border border-cyber-cyan/40 shadow-lg shadow-cyber-cyan/10 group-hover:border-cyber-cyan transition-all">
            <Vote className="w-6 h-6 text-cyber-cyan group-hover:scale-110 transition-transform" />
            <div className="absolute -inset-0.5 bg-cyber-cyan/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-widest uppercase font-semibold text-cyber-cyan">
                TN-SEC • Cyber-Elect
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
                v2026.4
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Tamil Nadu State Elections
            </h1>
          </div>
        </Link>

        {/* Center: System Status Monitors */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          {/* Real-time Poll Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            pollStatus.isOpen
              ? 'bg-emerald-950/60 border-cyber-emerald/40 text-cyber-emeraldLight'
              : 'bg-red-950/60 border-cyber-crimson/40 text-red-300'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                pollStatus.isOpen ? 'bg-cyber-emerald' : 'bg-cyber-crimson'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                pollStatus.isOpen ? 'bg-cyber-emerald' : 'bg-cyber-crimson'
              }`} />
            </span>
            <span className="font-semibold tracking-wider">
              {pollStatus.isOpen ? 'POLLS LIVE' : 'POLLS LOCKED'}
            </span>
          </div>

          {/* 2FA Biometric Security Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-800/80 border border-cyber-cyan/30 text-cyber-cyan">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>2FA BIOMETRIC SECURED</span>
          </div>

          {/* Real-time Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-800/80 border border-white/10 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedTime} IST</span>
          </div>
        </div>

        {/* Right: Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/voter"
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
              isActive('/voter')
                ? 'bg-cyber-cyan text-black font-semibold shadow-md shadow-cyber-cyan/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Voter Booth</span>
          </Link>

          {/* Voter List Link (requires admin authentication) */}
          <Link
            to={adminUser ? "/admin/register-voter?view=list" : "/admin/login"}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
              location.pathname.startsWith('/admin/register-voter')
                ? 'bg-navy-700 text-cyber-cyan border border-cyber-cyan/50 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
            }`}
            title={adminUser ? "View enrolled voter roll" : "Authentication required for voter roll"}
          >
            <Users className="w-4 h-4 text-cyber-cyan" />
            <span>Voter List</span>
          </Link>

          {/* Admin Navigation: shows Login when unauthenticated, Workspace & Logout when authenticated */}
          {adminUser ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/admin/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive('/admin') && !isActive('/admin/analytics') && !location.pathname.startsWith('/admin/register-voter')
                    ? 'bg-navy-700 text-white border border-cyber-cyan/50 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                }`}
                title="Access Admin Workspace"
              >
                <Settings className="w-4 h-4 text-cyber-cyan" />
                <span className="hidden sm:inline">Admin:</span>
                <span className="font-mono text-cyber-cyan font-bold">{adminUser.username}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-300 hover:text-white bg-red-950/60 hover:bg-red-900 border border-red-500/40 transition-all flex items-center gap-1 cursor-pointer"
                title="Logout from Admin Cyber Vault"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/admin/login"
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                isActive('/admin/login')
                  ? 'bg-navy-700 text-white border border-cyber-cyan/50 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-white/10'
              }`}
              title="Official Election Commission Officer Authentication"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Officer Login</span>
            </Link>
          )}

          <Link
            to="/admin/analytics"
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
              isActive('/admin/analytics')
                ? 'bg-gradient-to-r from-cyber-emerald to-emerald-400 text-black font-semibold shadow-md shadow-cyber-emerald/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Executive Analytics</span>
          </Link>
        </nav>

      </div>
    </header>
  );
}
