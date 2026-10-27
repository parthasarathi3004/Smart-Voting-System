import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Key, User, ArrowRight, Loader2, Lock, CheckCircle2, X, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Popup Modal State for Invalid Credentials
  const [showPopupModal, setShowPopupModal] = useState(false);
  const [popupData, setPopupData] = useState({
    title: '',
    tamilTitle: '',
    message: '',
    tamilMessage: ''
  });

  // Ensure any stale previous sessions are cleared when arriving on login screen
  useEffect(() => {
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminSession');
    sessionStorage.removeItem('activeAdminSession');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowPopupModal(false);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    try {
      const res = await api.adminLogin({ username: cleanUser, password: cleanPass });
      if (res.success) {
        // Store session ONLY in sessionStorage for active session (never persistent in localStorage)
        sessionStorage.setItem('activeAdminSession', JSON.stringify(res));
        sessionStorage.removeItem('adminSession');
        localStorage.removeItem('adminSession');
        navigate('/admin/dashboard');
      } else {

        triggerErrorPopup(
          res.message || 'Invalid Officer Username or Password! Access Denied.',
          res.tamilMessage || 'தவறான பயனர் பெயர் அல்லது கடவுச்சொல்! அணுகல் மறுக்கப்பட்டது.'
        );
      }
    } catch (err) {
      const errMsg = err.data?.message || err.message || 'Invalid Officer Username or Password! Access Denied.';
      const tamilMsg = err.data?.tamilMessage || 'தவறான பயனர் ஐடி அல்லது கடவுச்சொல்! அணுகல் மறுக்கப்பட்டது.';
      triggerErrorPopup(errMsg, tamilMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerErrorPopup = (engMsg, tamMsg) => {
    setError(engMsg);
    setPopupData({
      title: 'SECURITY AUTHENTICATION FAILED',
      tamilTitle: 'அங்கீகார தோல்வி / தவறான தகவல்',
      message: engMsg,
      tamilMessage: tamMsg
    });
    setShowPopupModal(true);
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        
        {/* Glow behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyber-cyan/30 to-cyber-emerald/30 rounded-2xl blur-xl opacity-50" />

        <div className="relative glass-panel rounded-2xl p-8 shadow-2xl border border-white/10">
          
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-cyan-950 to-navy-900 border border-cyber-cyan/40 text-cyber-cyan mb-3 shadow-lg shadow-cyber-cyan/20">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Election Officer Login</h2>
            <p className="text-xs text-slate-400 mt-1">Tamil Nadu State Election Commission Cyber Vault</p>
          </div>

          {error && !showPopupModal && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/80 border border-cyber-crimson/50 text-red-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-cyber-crimson" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Officer Username (ID)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. parthasarathi"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-navy-900/90 border border-white/15 focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan text-sm text-white placeholder:text-slate-500 outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Security Passcode
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passcode"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-navy-900/90 border border-white/15 focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan text-sm text-white placeholder:text-slate-500 outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full cyber-btn-cyan py-3 text-sm font-semibold tracking-wide uppercase cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Enter Portal</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* POPUP MODAL FOR FAILED LOGIN / WRONG ID OR PASSWORD */}
      {showPopupModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md glass-panel p-6 sm:p-7 rounded-2xl border-2 border-cyber-crimson shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-in zoom-in-95 duration-200">
            
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setShowPopupModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-red-950/90 border border-cyber-crimson text-cyber-crimson flex-shrink-0 animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyber-crimson text-black text-[10px] font-mono font-black uppercase tracking-wider">
                    ACCESS DENIED
                  </span>
                  <span className="text-xs font-mono font-bold text-red-400">
                    CYBER VAULT LOCK
                  </span>
                </div>
                
                <h3 className="text-lg font-black text-white tracking-tight">
                  {popupData.title}
                </h3>
                <p className="text-xs font-bold text-cyber-crimson font-sans mt-0.5">
                  {popupData.tamilTitle}
                </p>

                <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-900/60 text-xs font-mono text-red-200 leading-relaxed">
                  {popupData.message}
                </div>

                <p className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">
                  {popupData.tamilMessage}
                </p>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPopupModal(false);
                      setPassword('');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-cyber-crimson hover:from-red-500 hover:to-red-600 text-white font-mono font-bold text-xs shadow-lg shadow-red-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Try Again / மீண்டும் முயற்சிக்கவும்</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
