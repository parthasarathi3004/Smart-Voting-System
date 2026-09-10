import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileSpreadsheet, Plus, Upload, Clock, ShieldAlert, CheckCircle2, 
  ArrowLeft, Search, Filter, Lock, Unlock, AlertCircle, Loader2, Sparkles, Building 
} from 'lucide-react';
import { api } from '../services/api';
import PartySymbol from '../components/PartySymbol';


export default function CandidateManagement() {
  const [candidates, setCandidates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [constituenciesMap, setConstituenciesMap] = useState({});
  const [parties, setParties] = useState([]);

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedConstituency, setSelectedConstituency] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Election Time Window Config state
  const [electionConfig, setElectionConfig] = useState({
    electionDate: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '18:00',
    isLiveOverride: true,
    title: 'Tamil Nadu Legislative Assembly General Election 2026'
  });
  const [pollStatus, setPollStatus] = useState({ isOpen: true, reason: '', status: '' });
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    party: 'DMK',
    district: '',
    constituency: '',
    symbolUrl: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  // File upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [candRes, metaRes, partyRes, configRes] = await Promise.all([
        api.getCandidates(),
        api.getDistrictsAndConstituencies(),
        api.getParties(),
        api.getElectionConfig()
      ]);

      setCandidates(candRes.candidates || []);
      setDistricts(metaRes.districts || []);
      setConstituenciesMap(metaRes.constituenciesByDistrict || {});
      setParties(partyRes.parties || []);

      if (configRes.config) setElectionConfig(configRes.config);
      if (configRes.status) setPollStatus(configRes.status);

      if (metaRes.districts && metaRes.districts.length > 0) {
        setNewCandidate(prev => ({
          ...prev,
          district: metaRes.districts[0],
          constituency: (metaRes.constituenciesByDistrict?.[metaRes.districts[0]] || [])[0] || ''
        }));
      }
    } catch (err) {
      console.error('Error loading candidates page data:', err);
    }
  };

  // Update Election Window
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsUpdatingConfig(true);
    setConfigSuccessMsg('');
    try {
      const res = await api.updateElectionConfig({
        ...electionConfig,
        resetWindowVotes: true
      });
      if (res.success) {
        setElectionConfig(res.config);
        setPollStatus(res.status);
        setConfigSuccessMsg(res.message || 'Election time window updated & polling session reset for fresh voting.');
        setTimeout(() => setConfigSuccessMsg(''), 5000);
        const candRes = await api.getCandidates();
        if (candRes?.candidates) setCandidates(candRes.candidates);
      }
    } catch (err) {
      console.error('Failed to update config:', err);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // Start fresh polling window session
  const handleStartFreshSession = async () => {
    if (!window.confirm('Start a new polling session? This will reset PowerBI charts to 0 and allow registered voters to cast ballots in this fresh window.')) {
      return;
    }
    setIsUpdatingConfig(true);
    setConfigSuccessMsg('');
    try {
      const res = await api.startNewElectionSession();
      if (res.success) {
        setElectionConfig(res.config);
        setPollStatus(res.status);
        setConfigSuccessMsg('✓ New polling window session started! PowerBI charts reset to 0 for fresh voting.');
        setTimeout(() => setConfigSuccessMsg(''), 5000);
        const candRes = await api.getCandidates();
        if (candRes?.candidates) setCandidates(candRes.candidates);
      }
    } catch (err) {
      console.error('Failed to start new session:', err);
    } finally {
      setIsUpdatingConfig(false);
    }
  };


  // Upload Spreadsheet
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadMsg(null);

    const formData = new FormData();
    formData.append('datasetFile', uploadFile);

    try {
      const res = await api.uploadDataset(formData);
      if (res.success) {
        setUploadMsg({ type: 'success', text: res.message });
        setUploadFile(null);
        // Refresh candidates
        const candRes = await api.getCandidates();
        setCandidates(candRes.candidates || []);
      } else {
        setUploadMsg({ type: 'error', text: res.message || 'Upload failed.' });
      }
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.message || 'Error processing spreadsheet file.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Add Candidate
  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await api.addCandidate(newCandidate);
      if (res.success) {
        setShowAddModal(false);
        setNewCandidate({
          name: '',
          party: 'DMK',
          district: districts[0] || '',
          constituency: (constituenciesMap[districts[0]] || [])[0] || '',
          symbolUrl: ''
        });
        const candRes = await api.getCandidates();
        setCandidates(candRes.candidates || []);
      }
    } catch (err) {
      alert(err.message || 'Failed to add candidate.');
    } finally {
      setIsAdding(false);
    }
  };

  // Filtered candidate list
  const filteredCandidates = candidates.filter(c => {
    const matchesDistrict = selectedDistrict === 'ALL' || c.district.toLowerCase() === selectedDistrict.toLowerCase();
    const matchesConstituency = selectedConstituency === 'ALL' || c.constituency.toLowerCase() === selectedConstituency.toLowerCase();
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.constituency.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesConstituency && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back Link & Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyber-cyan transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO DASHBOARD</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-cyber-emerald bg-navy-900/80 px-3 py-1 rounded-full border border-cyber-emerald/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MODULE: CANDIDATES & ELECTION WINDOW</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Candidate Management & Election Configurator
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage candidates across all 234 assembly seats, sync Excel datasets, and control live polling hours.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="cyber-btn-cyan text-xs"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* TOP SECTION: Election Time Window Controller Card */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 mb-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${
              pollStatus.isOpen 
                ? 'bg-emerald-950/80 border-cyber-emerald/50 text-cyber-emerald' 
                : 'bg-red-950/80 border-cyber-crimson/50 text-cyber-crimson'
            }`}>
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Election Time Window Controller</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  pollStatus.isOpen 
                    ? 'bg-emerald-950 border-cyber-emerald text-cyber-emerald' 
                    : 'bg-red-950 border-cyber-crimson text-red-300'
                }`}>
                  {pollStatus.isOpen ? 'VOTING UNLOCKED' : 'VOTING HARD-LOCKED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Status: <span className={pollStatus.isOpen ? 'text-cyber-emerald font-semibold' : 'text-cyber-crimson font-semibold'}>{pollStatus.reason}</span>
              </p>
            </div>
          </div>

          {/* Quick Override Toggle */}
          <div className="flex items-center gap-3 bg-navy-900/90 p-3 rounded-xl border border-white/10">
            <span className="text-xs font-mono text-slate-300">Live Poll Override:</span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !electionConfig.isLiveOverride;
                setElectionConfig(prev => ({ ...prev, isLiveOverride: nextVal }));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                electionConfig.isLiveOverride
                  ? 'bg-cyber-emerald text-black shadow-lg shadow-cyber-emerald/30'
                  : 'bg-navy-800 text-slate-400 border border-white/10'
              }`}
            >
              {electionConfig.isLiveOverride ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{electionConfig.isLiveOverride ? 'FORCED OPEN' : 'STRICT CLOCK'}</span>
            </button>
          </div>
        </div>

        {configSuccessMsg && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-950/70 border border-cyber-emerald/50 text-cyber-emerald text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{configSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Election Date
            </label>
            <input
              type="date"
              value={electionConfig.electionDate}
              onChange={(e) => setElectionConfig(prev => ({ ...prev, electionDate: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-navy-900 border border-white/15 text-white text-xs focus:border-cyber-cyan outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Polls Open Time (IST)
            </label>
            <input
              type="time"
              value={electionConfig.startTime}
              onChange={(e) => setElectionConfig(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-navy-900 border border-white/15 text-white text-xs focus:border-cyber-cyan outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Polls Close Time (IST)
            </label>
            <input
              type="time"
              value={electionConfig.endTime}
              onChange={(e) => setElectionConfig(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-navy-900 border border-white/15 text-white text-xs focus:border-cyber-cyan outline-none"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:col-span-2 lg:col-span-4 mt-2 pt-4 border-t border-white/10 justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">Active Session:</span>
              <code className="text-[11px] font-mono text-cyber-cyan bg-navy-950 px-2.5 py-0.5 rounded-md border border-cyber-cyan/30">
                {electionConfig.sessionId || 'SESSION-DEFAULT'}
              </code>
              <span className="hidden md:inline text-[11px] text-slate-400 ml-2">
                (Votes polled in this window stream live to PowerBI)
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleStartFreshSession}
                disabled={isUpdatingConfig}
                className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-amber-400/40 text-amber-400 hover:bg-amber-950/40 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Start a fresh session to reset PowerBI visuals to 0 for new test voting"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Start Fresh Polling Session</span>
              </button>

              <button
                type="submit"
                disabled={isUpdatingConfig}
                className="w-1/2 sm:w-auto cyber-btn-cyan text-xs py-2.5 px-6 cursor-pointer"
              >
                {isUpdatingConfig ? 'Saving...' : 'Save Time Window'}
              </button>
            </div>
          </div>
        </form>
      </div>


      {/* SPREADSHEET SYNC & BULK UPLOAD CARD */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyber-cyan/40 text-cyber-cyan">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Excel / CSV Candidate Dataset Sync</h3>
              <p className="text-xs text-slate-400">
                Columns: <code className="text-cyber-cyan">CandidateName, PartyName, PartySymbolUrl, District, Constituency</code>
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-navy-900 border border-white/15 text-slate-300">
            Current Dataset: <strong className="text-cyber-cyan">{candidates.length} Candidates</strong>
          </span>
        </div>

        {uploadMsg && (
          <div className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
            uploadMsg.type === 'success' 
              ? 'bg-emerald-950/80 border border-cyber-emerald/50 text-cyber-emerald' 
              : 'bg-red-950/80 border border-cyber-crimson/50 text-red-200'
          }`}>
            {uploadMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{uploadMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex-1 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-navy-900 border border-white/15 hover:border-cyber-cyan/50 cursor-pointer text-xs text-slate-300">
            <Upload className="w-4 h-4 text-cyber-cyan flex-shrink-0" />
            <span className="truncate">{uploadFile ? uploadFile.name : 'Select .xlsx or .csv dataset file to upload...'}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setUploadFile(e.target.files[0] || null)}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={!uploadFile || isUploading}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 ${
              uploadFile && !isUploading
                ? 'cyber-btn-cyan'
                : 'bg-navy-800 text-slate-500 border border-white/10 cursor-not-allowed'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Syncing Dataset...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload & Sync Candidates</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* CANDIDATES DIRECTORY & FILTERS */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Participating Candidates Directory</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredCandidates.length} of {candidates.length} candidates contesting Tamil Nadu General Elections
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate, party, seat..."
                className="pl-8 pr-3 py-2 rounded-lg bg-navy-900 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:border-cyber-cyan outline-none w-48 sm:w-56"
              />
            </div>

            {/* District Slicer */}
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedConstituency('ALL');
              }}
              className="px-3 py-2 rounded-lg bg-navy-900 border border-white/15 text-xs text-white focus:border-cyber-cyan outline-none"
            >
              <option value="ALL">All Districts ({districts.length})</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Constituency Slicer */}
            <select
              value={selectedConstituency}
              onChange={(e) => setSelectedConstituency(e.target.value)}
              className="px-3 py-2 rounded-lg bg-navy-900 border border-white/15 text-xs text-white focus:border-cyber-cyan outline-none"
            >
              <option value="ALL">All Constituencies</option>
              {selectedDistrict !== 'ALL' && (constituenciesMap[selectedDistrict] || []).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1">
          {filteredCandidates.slice(0, 90).map((cand) => (
            <div
              key={cand.id}
              className="glass-card p-4 rounded-xl border border-white/10 hover:border-cyber-cyan/40 transition-all flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-navy-900 border border-white/15 flex-shrink-0 relative">
                <img
                  src={cand.photoUrl}
                  alt={cand.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-white truncate">{cand.name}</h4>
                  <PartySymbol
                    party={cand.party}
                    symbolUrl={cand.symbolUrl}
                    className="w-6 h-6 flex-shrink-0"
                  />

                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                    style={{ backgroundColor: `${cand.themeColor}20`, color: cand.themeColor, borderColor: `${cand.themeColor}50`, borderWidth: '1px' }}
                  >
                    {cand.party}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">
                    {cand.constituency}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-400 font-mono">
                  <span>{cand.district} Dist.</span>
                  <span className="text-cyber-cyan font-bold">{cand.votes || 0} Votes</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCandidates.length > 90 && (
          <p className="text-center text-xs font-mono text-slate-400 mt-4">
            Showing first 90 candidates. Use district/constituency slicers to inspect specific seats.
          </p>
        )}
      </div>

      {/* MODAL: ADD CANDIDATE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 sm:p-8 border border-white/15">
            <h3 className="text-lg font-bold text-white mb-1">Add Contesting Candidate</h3>
            <p className="text-xs text-slate-400 mb-6">Enroll candidate for an Assembly Constituency.</p>

            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  placeholder="e.g. M. K. Stalin"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-navy-900 border border-white/15 text-sm text-white focus:border-cyber-cyan outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Party Name *
                </label>
                <select
                  value={newCandidate.party}
                  onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-navy-900 border border-white/15 text-sm text-white focus:border-cyber-cyan outline-none"
                >
                  {parties.map(p => (
                    <option key={p.partyName} value={p.partyName}>{p.partyName}</option>
                  ))}
                  <option value="Independent">Independent</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    District *
                  </label>
                  <select
                    value={newCandidate.district}
                    onChange={(e) => {
                      const dist = e.target.value;
                      setNewCandidate({
                        ...newCandidate,
                        district: dist,
                        constituency: (constituenciesMap[dist] || [])[0] || ''
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-navy-900 border border-white/15 text-sm text-white focus:border-cyber-cyan outline-none"
                  >
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Constituency *
                  </label>
                  <select
                    value={newCandidate.constituency}
                    onChange={(e) => setNewCandidate({ ...newCandidate, constituency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-navy-900 border border-white/15 text-sm text-white focus:border-cyber-cyan outline-none"
                  >
                    {(constituenciesMap[newCandidate.district] || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Party Symbol URL (Optional)
                </label>
                <input
                  type="url"
                  value={newCandidate.symbolUrl}
                  onChange={(e) => setNewCandidate({ ...newCandidate, symbolUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-navy-900 border border-white/15 text-sm text-white focus:border-cyber-cyan outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="cyber-btn-cyan text-xs"
                >
                  {isAdding ? 'Enrolling...' : 'Save Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
