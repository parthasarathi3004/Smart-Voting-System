import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, FileSpreadsheet, BarChart3, Clock, ShieldCheck, 
  Vote, CheckCircle2, AlertTriangle, LogOut, ArrowRight, LifeBuoy, FileText,
  Smartphone, Send, KeyRound, Check, RefreshCw, X, ShieldAlert, Radio
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCandidates: 970,
    totalDistricts: 38,
    totalConstituencies: 234,
    totalVoters: 0,
    totalVotes: 0,
    turnout: 0
  });
  const [electionConfig, setElectionConfig] = useState(null);
  const [auditLedger, setAuditLedger] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [votersRes, analyticsRes, configRes, auditRes, ticketsRes] = await Promise.all([
        api.getVoters().catch(() => ({ voters: [] })),
        api.getAnalytics().catch(() => ({ analytics: { turnout: {} } })),
        api.getElectionConfig().catch(() => ({ config: {}, status: {} })),
        api.getAuditLedger().catch(() => ({ ledger: [] })),
        api.getSupportTickets().catch(() => ({ tickets: [] }))
      ]);

      const totalVoters = votersRes.voters?.length || 0;
      const turnoutData = analyticsRes.analytics?.turnout || {};

      setStats({
        totalCandidates: 970,
        totalDistricts: 38,
        totalConstituencies: 234,
        totalVoters: totalVoters,
        totalVotes: turnoutData.totalVotesCast || 0,
        turnout: turnoutData.turnoutPercentage || 0
      });

      setElectionConfig(configRes);
      setAuditLedger(auditRes.ledger || []);
      setSupportTickets(ticketsRes.tickets || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminSession');
    sessionStorage.removeItem('activeAdminSession');
    navigate('/admin/login');
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyber-cyan mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-cyber-cyan animate-ping" />
            <span>COMMAND & CONTROL CENTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Election Administration Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamil Nadu Legislative Assembly General Election 2026 Management Console
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="cyber-btn-glass text-xs"
          >
            Refresh Telemetry
          </button>
          <button
            onClick={handleLogout}
            className="cyber-btn-crimson text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Clickable Registered Voters KPI Card */}
        <Link
          to="/admin/register-voter?view=list"
          className="glass-panel p-5 rounded-xl hover:border-cyber-cyan transition-all hover:scale-[1.02] cursor-pointer group block"
          title="Click to view all registered voters"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 group-hover:text-cyber-cyan transition-colors">
              REGISTERED VOTERS
            </span>
            <Users className="w-4 h-4 text-cyber-cyan group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{stats.totalVoters}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-cyber-cyan font-mono">Biometrics Verified</span>
            <span className="text-[10px] font-mono text-slate-400 group-hover:text-cyber-cyan flex items-center gap-0.5">
              View List →
            </span>
          </div>
        </Link>

        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">VOTES CAST</span>
            <Vote className="w-4 h-4 text-cyber-emerald" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{stats.totalVotes}</div>
          <span className="text-[11px] text-cyber-emerald font-mono mt-1 block">
            {stats.turnout}% Turnout
          </span>
        </div>

        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">SEATS / CANDIDATES</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">234 / 970</div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Across 38 Districts</span>
        </div>

        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">POLL WINDOW</span>
            <Clock className="w-4 h-4 text-cyber-cyan" />
          </div>
          <div className="text-lg font-bold text-cyber-emerald font-mono">
            {electionConfig?.status?.isOpen ? 'POLLS ACTIVE' : 'LOCKED'}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            {electionConfig?.config?.startTime || '07:00'} - {electionConfig?.config?.endTime || '18:00'} IST
          </span>
        </div>

      </div>

      {/* Main Feature Modules Nav */}
      <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-semibold mb-4">
        Administrative Control Modules
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Module 1: Voter Registration & Directory */}
        <div className="glass-panel p-6 rounded-2xl hover:border-cyber-cyan/60 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyber-cyan/40 text-cyber-cyan w-fit group-hover:scale-110 transition-transform">
                <UserPlus className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-950 border border-cyber-cyan/30 text-cyber-cyan font-bold">
                {stats.totalVoters} Enrolled
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyber-cyan transition-colors">
              Voter Registration & Electoral Directory
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              View registered voters with real webcam photos, enroll citizen biometrics (live webcam face capture), and verify age eligibility.
            </p>
          </div>
          <div className="pt-4 border-t border-white/10 flex items-center gap-2.5">
            <Link
              to="/admin/register-voter?view=list"
              className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyber-cyan/50 text-cyber-cyan text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-950/50"
            >
              <Users className="w-3.5 h-3.5" />
              <span>View Voter List ({stats.totalVoters})</span>
            </Link>
            <Link
              to="/admin/register-voter?view=register"
              className="py-2.5 px-3.5 rounded-xl cyber-btn-cyan text-xs font-mono font-bold flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-black" />
              <span>+ Enroll</span>
            </Link>
          </div>
        </div>

        {/* Module 2: Candidate Management & Config */}
        <Link
          to="/admin/candidates"
          className="glass-panel p-6 rounded-2xl hover:border-cyber-emerald/60 transition-all hover:scale-[1.02] group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-cyber-emerald/40 text-cyber-emerald w-fit mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyber-emerald transition-colors">
              Candidates & Time Window Config
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Manage 970 pre-loaded candidates across 234 seats, upload Excel/CSV datasets, add custom candidates, and configure active voting hours controller.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-cyber-emerald group-hover:translate-x-1 transition-transform">
            <span>Configure Candidates & Hours</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Module 3: Executive PowerBI Analytics */}
        <Link
          to="/admin/analytics"
          className="glass-panel p-6 rounded-2xl hover:border-amber-400/60 transition-all hover:scale-[1.02] group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-400/40 text-amber-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
              Executive PowerBI Analytics
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Full election intelligence dashboard with District & Constituency slicers, First-Past-The-Post Grand Winner Showcase, and descending Seat Share Leaderboard.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>View Executive Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

      </div>

      {/* Audit & Tickets Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tamper-Proof Audit Trail */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyber-cyan" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                SHA-256 Tamper-Proof Audit Ledger
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyber-cyan/30 text-cyber-cyan">
              {auditLedger.length} Verified Records
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {auditLedger.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No ballots polled yet. Verified transactions will appear here in real-time.
              </p>
            ) : (
              auditLedger.slice(-5).reverse().map((entry, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-navy-900/90 border border-white/10 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-cyber-cyan font-bold">{entry.auditId}</span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-white mt-1">
                    {entry.constituency} ({entry.district}) • <span className="text-cyber-emerald">{entry.party}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-1 bg-black/40 p-1 rounded">
                    HASH: {entry.receiptHash}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Support Tickets Log */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-cyber-emerald" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Voter HelpDesk Inbound Tickets
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-cyber-emerald/30 text-cyber-emerald">
              Dispatched to parthasarathi3046@gmail.com
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {supportTickets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No active helpdesk tickets. Voter requests submitted via "Help Me" will be logged here.
              </p>
            ) : (
              supportTickets.slice(-5).reverse().map((tkt, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-navy-900/90 border border-white/10 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{tkt.name}</span>
                    <span className="text-cyber-cyan font-mono text-[10px]">{tkt.id}</span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1 line-clamp-2">{tkt.issue}</p>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Phone: {tkt.phone || 'N/A'} • {new Date(tkt.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
