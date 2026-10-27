import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, Award, Users, Vote, PieChart as PieIcon, 
  ArrowLeft, RefreshCw, Filter, Trophy, TrendingUp, CheckCircle2, ChevronRight,
  Radio, Clock, Sparkles
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { api } from '../services/api';
import PartySymbol from '../components/PartySymbol';


export default function ExecutiveAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [constituenciesMap, setConstituenciesMap] = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedConstituency, setSelectedConstituency] = useState('ALL');
  const [sessionMode, setSessionMode] = useState('ACTIVE'); // 'ACTIVE' (current window) | 'ALL' (historical archive)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMeta();
    fetchAnalytics('ALL', 'ALL', 'ACTIVE');

    // Auto-refresh live PowerBI stream every 10 seconds
    const interval = setInterval(() => {
      fetchAnalytics(selectedDistrict, selectedConstituency, sessionMode, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedDistrict, selectedConstituency, sessionMode]);

  const loadMeta = async () => {
    try {
      const res = await api.getDistrictsAndConstituencies();
      setDistricts(res.districts || []);
      setConstituenciesMap(res.constituenciesByDistrict || {});
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const fetchAnalytics = async (district = selectedDistrict, constituency = selectedConstituency, mode = sessionMode, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = {};
      if (district && district !== 'ALL') params.district = district;
      if (constituency && constituency !== 'ALL') params.constituency = constituency;
      params.session = mode;
      const res = await api.getAnalytics(params);
      setAnalytics(res.analytics);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleDistrictChange = (d) => {
    setSelectedDistrict(d);
    setSelectedConstituency('ALL');
    fetchAnalytics(d, 'ALL', sessionMode);
  };

  const handleConstituencyChange = (c) => {
    setSelectedConstituency(c);
    fetchAnalytics(selectedDistrict, c, sessionMode);
  };


  const turnout = analytics?.turnout || {
    totalRegisteredVoters: 0,
    totalVotesCast: 0,
    turnoutPercentage: 0,
    totalConstituencies: 234
  };

  const grandWinner = analytics?.grandWinner || {
    partyName: 'Election Underway',
    seatsWon: 0,
    totalSeats: 234,
    declaration: 'Polling Active'
  };

  const seatLeaderboard = analytics?.seatLeaderboard || [];
  const candidateChartData = analytics?.candidateChartData || [];
  const constituencyWinners = analytics?.constituencyWinners || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyber-cyan transition-colors mr-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>DASHBOARD</span>
            </Link>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/40 text-amber-400 font-bold uppercase tracking-wider">
              POWERBI EXECUTIVE INTELLIGENCE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Tamil Nadu Assembly Election Analytics 2026
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time First-Past-The-Post seat determination across all 234 constituencies.
          </p>
        </div>

        {/* Filter Slicers Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* District Slicer */}
          <div className="flex items-center gap-1.5 bg-navy-900 px-3 py-1.5 rounded-xl border border-white/15 text-xs">
            <Filter className="w-3.5 h-3.5 text-cyber-cyan" />
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-navy-900">All Districts ({districts.length})</option>
              {districts.map(d => (
                <option key={d} value={d} className="bg-navy-900">{d} District</option>
              ))}
            </select>
          </div>

          {/* Constituency Slicer */}
          <div className="flex items-center gap-1.5 bg-navy-900 px-3 py-1.5 rounded-xl border border-white/15 text-xs">
            <select
              value={selectedConstituency}
              onChange={(e) => handleConstituencyChange(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-navy-900">All Constituencies</option>
              {selectedDistrict !== 'ALL' && (constituenciesMap[selectedDistrict] || []).map(c => (
                <option key={c} value={c} className="bg-navy-900">{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchAnalytics(selectedDistrict, selectedConstituency, sessionMode)}
            className="cyber-btn-glass text-xs p-2.5"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyber-cyan' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Election Time Window Status Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-navy-900/90 border border-cyber-cyan/30 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyber-cyan/40 text-cyber-cyan flex-shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Active Polling Window Session</h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                sessionMode === 'ACTIVE' 
                  ? 'bg-emerald-950 text-cyber-emerald border-cyber-emerald/40' 
                  : 'bg-amber-950 text-amber-400 border-amber-400/40'
              }`}>
                {sessionMode === 'ACTIVE' ? 'LIVE WINDOW' : 'HISTORICAL ARCHIVE'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-300 mt-0.5">
              Election Date: <strong className="text-cyber-cyan">{analytics?.activeWindow?.electionDate || 'Today'}</strong> • Window Hours: <strong className="text-white">{analytics?.activeWindow?.startTime || '07:00'} - {analytics?.activeWindow?.endTime || '18:00'} IST</strong>
            </p>
          </div>
        </div>

        {/* Session Mode Selector Switcher */}
        <div className="flex items-center gap-2 bg-navy-950 p-1.5 rounded-xl border border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setSessionMode('ACTIVE');
              fetchAnalytics(selectedDistrict, selectedConstituency, 'ACTIVE');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              sessionMode === 'ACTIVE'
                ? 'bg-cyber-cyan text-black shadow-md shadow-cyber-cyan/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Active Time Window</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSessionMode('ALL');
              fetchAnalytics(selectedDistrict, selectedConstituency, 'ALL');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              sessionMode === 'ALL'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>All-Time Archive</span>
          </button>
        </div>
      </div>

      {/* Zero Votes Informational Card for Fresh/Reset Time Window */}
      {turnout.overallVotesPolled === 0 && (
        <div className="p-6 rounded-2xl bg-cyan-950/40 border border-cyber-cyan/40 mb-8 text-center animate-in fade-in">
          <Sparkles className="w-8 h-8 text-cyber-cyan mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">
            Polling Window Initialized — 0 Votes Polled Yet
          </h3>
          <p className="text-xs text-slate-300 max-w-lg mx-auto mt-1">
            The election time window for <strong className="text-cyber-cyan">{analytics?.activeWindow?.electionDate}</strong> is currently active. 
            As citizens cast their ballots in the voting booth, live PowerBI seat charts, vote shares, and constituency winners will visualize here automatically.
          </p>
        </div>
      )}

      {/* PROMINENT GRAND WINNER SHOWCASE CARD */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 border-2 border-amber-400/50 shadow-2xl shadow-amber-500/10 mb-8">

        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/15 via-cyber-cyan/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-950 border border-amber-400/50 shadow-xl shadow-amber-500/20 text-amber-400">
              <Trophy className="w-12 h-12 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-3 py-0.5 rounded-full bg-amber-950 border border-amber-400/60 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                  STATEWIDE WINNER DETERMINATION ENGINE
                </span>
                {grandWinner.isMajority && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-cyber-emerald text-cyber-emerald text-xs font-mono font-bold">
                    MAJORITY FORMED (118+ SEATS)
                  </span>
                )}
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {grandWinner.declaration}
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                First-Past-The-Post aggregation across 234 assembly constituencies • Simple Majority: 118 Seats
              </p>
            </div>
          </div>

          {/* Quick Stat Pill */}
          <div className="flex items-center gap-4 bg-navy-950/80 p-4 rounded-2xl border border-white/10">
            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 block">Leading Party</span>
              <span className="text-xl font-black text-amber-400 font-mono">{grandWinner.partyName}</span>
            </div>
            <div className="h-10 w-[1px] bg-white/10" />
            <div>
              <span className="text-xs font-mono text-slate-400 block">Seats Won</span>
              <span className="text-xl font-black text-white font-mono">{grandWinner.seatsWon} / 234</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI TURNOUT METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>REGISTERED VOTERS</span>
            <Users className="w-4 h-4 text-cyber-cyan" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{turnout.totalRegisteredVoters}</div>
          <span className="text-[11px] text-slate-400 font-mono">Enrolled on Electoral Roll</span>
        </div>

        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>TOTAL VOTES CAST</span>
            <Vote className="w-4 h-4 text-cyber-emerald" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{turnout.totalVotesCast}</div>
          <span className="text-[11px] text-cyber-emerald font-mono">Cryptographically Audited</span>
        </div>

        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>STATEWIDE TURNOUT</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{turnout.turnoutPercentage}%</div>
          <span className="text-[11px] text-slate-400 font-mono">Voter Participation Rate</span>
        </div>

        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>ASSEMBLY SEATS</span>
            <Award className="w-4 h-4 text-cyber-cyan" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{turnout.totalConstituencies || 234}</div>
          <span className="text-[11px] text-slate-400 font-mono">Tamil Nadu Legislative Assembly</span>
        </div>
      </div>

      {/* MID SECTION: SEAT SHARE LEADERBOARD & CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* SEAT SHARE LEADERBOARD (Strictly Descending Order) - 5 Cols */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Seat Share Leaderboard</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-900 border border-white/15 text-slate-300">
                Ranked Descending
              </span>
            </div>

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {seatLeaderboard.map((item, idx) => (
                <div
                  key={item.partyName}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    idx === 0 && item.seatsWon > 0
                      ? 'bg-amber-950/40 border-amber-400/40 shadow-lg'
                      : 'bg-navy-900/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-navy-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>

                    <PartySymbol party={item.partyName} symbolUrl={item.symbolUrl} className="w-7 h-7" />


                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{item.partyName}</span>
                        {idx === 0 && item.seatsWon > 0 && (
                          <span className="text-[10px] text-amber-400 font-mono uppercase font-bold">Leading</span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {item.totalVotes} votes • {item.voteSharePercentage}% Share
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-white font-mono">{item.seatsWon}</div>
                    <span className="text-[10px] font-mono uppercase text-slate-400">Seats Won</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 mt-4 text-[11px] font-mono text-slate-400 text-center">
            Total Seats: 234 • Majority Magic Number: 118
          </div>
        </div>

        {/* CANDIDATE VOTE BREAKDOWN CHARTS - 7 Cols */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Vote Distribution Breakdown</h3>
              <p className="text-xs text-slate-400">Votes per candidate in current selection</p>
            </div>
            <span className="text-xs font-mono text-cyber-cyan">
              {candidateChartData.length} Candidates
            </span>
          </div>

          {candidateChartData.length > 0 ? (
            <div className="h-96 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={candidateChartData} margin={{ top: 20, right: 20, left: -10, bottom: 60 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    angle={-35} 
                    textAnchor="end" 
                    interval={0}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(value, name, props) => [
                      `${value} Votes (${props.payload.party})`, 
                      props.payload.name
                    ]}
                  />
                  <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                    {candidateChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.themeColor || '#06b6d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-slate-400 text-xs">
              <BarChart3 className="w-10 h-10 text-slate-600 mb-2" />
              <span>No votes cast yet in this constituency selection.</span>
            </div>
          )}
        </div>

      </div>

      {/* CONSTITUENCY LEVEL RESULTS TABLE */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Constituency First-Past-The-Post Breakdown</h3>
            <p className="text-xs text-slate-400">
              Showing winners and margin of victory per constituency
            </p>
          </div>
          <span className="text-xs font-mono text-slate-300">
            {constituencyWinners.length} Assembly Seats
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-3 px-4 font-semibold">CONSTITUENCY</th>
                <th className="py-3 px-4 font-semibold">DISTRICT</th>
                <th className="py-3 px-4 font-semibold">LEAD CANDIDATE</th>
                <th className="py-3 px-4 font-semibold">PARTY</th>
                <th className="py-3 px-4 font-semibold text-right">VOTES</th>
                <th className="py-3 px-4 font-semibold text-right">MARGIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {constituencyWinners.slice(0, 30).map((c, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{c.constituency}</td>
                  <td className="py-3 px-4 text-slate-300">{c.district}</td>
                  <td className="py-3 px-4 text-cyber-cyan">{c.winner}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-navy-900 border border-white/10 text-slate-200">
                      {c.winnerParty}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white">{c.winnerVotes}</td>
                  <td className="py-3 px-4 text-right text-cyber-emerald">+{c.margin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
