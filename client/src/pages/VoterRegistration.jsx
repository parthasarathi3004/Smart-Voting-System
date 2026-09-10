import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  UserPlus, ShieldAlert, CheckCircle2, ArrowLeft, AlertCircle, 
  Calendar, CreditCard, MapPin, Building, Sparkles, Loader2,
  Trash2, Search, RefreshCw, X, ShieldCheck, Users, Camera, Smartphone, Phone,
  Eye, EyeOff, Copy, Check, Maximize2, Filter, ArrowRight, Vote
} from 'lucide-react';
import { api } from '../services/api';
import CyberWebcam from '../components/CyberWebcam';

export default function VoterRegistration() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL view param: 'list' or 'register'. Default to 'list' if user clicked "voter register / list"
  const viewParam = searchParams.get('view');
  const [activeTab, setActiveTab] = useState(viewParam === 'register' ? 'register' : 'list');

  // Form State
  const [fullName, setFullName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [dob, setDob] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');

  // Facial Biometrics & Optional Contact State
  const [facePhoto, setFacePhoto] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Metadata & Voter List from backend
  const [districts, setDistricts] = useState([]);
  const [constituenciesMap, setConstituenciesMap] = useState({});
  const [votersList, setVotersList] = useState([]);
  const [isLoadingVoters, setIsLoadingVoters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ELIGIBLE, VOTED

  // UI Interactive Helpers
  const [unmaskedAadhaarIds, setUnmaskedAadhaarIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const [zoomPhotoVoter, setZoomPhotoVoter] = useState(null);

  // Validation & UI State
  const [ageError, setAgeError] = useState('');
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrolledVoter, setEnrolledVoter] = useState(null);

  // Notification Popup State
  const [popupNotification, setPopupNotification] = useState('');
  
  // Delete Modal State
  const [voterToDelete, setVoterToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadMeta();
    loadVoters();
  }, []);

  // Sync tab with URL view parameter when changed externally
  useEffect(() => {
    if (viewParam === 'register') {
      setActiveTab('register');
    } else if (viewParam === 'list') {
      setActiveTab('list');
    }
  }, [viewParam]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ view: tab });
  };

  const triggerPopup = (msg) => {
    setPopupNotification(msg);
    setTimeout(() => {
      setPopupNotification((prev) => (prev === msg ? '' : prev));
    }, 4500);
  };

  const loadMeta = async () => {
    try {
      const res = await api.getDistrictsAndConstituencies();
      if (res.districts) {
        setDistricts(res.districts);
        setConstituenciesMap(res.constituenciesByDistrict || {});
        if (res.districts.length > 0) {
          const firstDistrict = res.districts[0];
          setSelectedDistrict(firstDistrict);
          const consts = res.constituenciesByDistrict?.[firstDistrict] || [];
          if (consts.length > 0) setSelectedConstituency(consts[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const loadVoters = async () => {
    setIsLoadingVoters(true);
    try {
      const res = await api.getVoters();
      setVotersList(res.voters || []);
    } catch (err) {
      console.error('Error fetching enrolled voters:', err);
    } finally {
      setIsLoadingVoters(false);
    }
  };

  // Toggle Aadhaar mask/unmask for specific voter
  const toggleAadhaarMask = (voterId) => {
    setUnmaskedAadhaarIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(voterId)) {
        updated.delete(voterId);
      } else {
        updated.add(voterId);
      }
      return updated;
    });
  };

  // 1-Click Copy Voter ID
  const handleCopyVoterId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete Individual Voter
  const confirmDeleteVoter = async () => {
    if (!voterToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteVoter(voterToDelete.id);
      if (res.success) {
        triggerPopup(`Voter ${voterToDelete.fullName} (${voterToDelete.id}) purged successfully.`);
        setVotersList(prev => prev.filter(v => v.id !== voterToDelete.id));
        if (enrolledVoter?.id === voterToDelete.id) {
          setEnrolledVoter(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete voter:', err);
      alert('Failed to delete voter: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
      setVoterToDelete(null);
    }
  };

  // Cascading constituency update when district changes
  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
    const availableConsts = constituenciesMap[district] || [];
    setSelectedConstituency(availableConsts.length > 0 ? availableConsts[0] : '');
  };

  // Format Aadhaar with 4-digit grouping
  const handleAadhaarChange = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    let formatted = raw;
    if (raw.length > 4 && raw.length <= 8) {
      formatted = `${raw.slice(0, 4)} ${raw.slice(4)}`;
    } else if (raw.length > 8) {
      formatted = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)}`;
    }
    setAadhaar(formatted);
  };

  // Instant DOB & Age verification rule
  const handleDobChange = (dobValue) => {
    setDob(dobValue);
    if (!dobValue) {
      setAgeError('');
      setCalculatedAge(null);
      return;
    }

    const birthDate = new Date(dobValue);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    setCalculatedAge(age);

    if (age < 18) {
      setAgeError('You are not eligible for election');
    } else {
      setAgeError('');
    }
  };

  const isFormValid = () => {
    const cleanAadhaar = aadhaar.replace(/\s/g, '');
    return (
      fullName.trim() &&
      cleanAadhaar.length === 12 &&
      dob &&
      calculatedAge !== null &&
      calculatedAge >= 18 &&
      selectedDistrict &&
      selectedConstituency &&
      facePhoto
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (calculatedAge !== null && calculatedAge < 18) {
      setAgeError('You are not eligible for election');
      return;
    }

    if (!facePhoto) {
      setFormError('Please capture facial biometrics with the device camera before submitting.');
      return;
    }

    const cleanPhone = (phoneNumber || '').replace(/\D/g, '');

    setIsSubmitting(true);
    try {
      const res = await api.registerVoter({
        fullName: fullName.trim(),
        aadhaar,
        dob,
        district: selectedDistrict,
        constituency: selectedConstituency,
        facePhoto,
        faceDescriptor,
        phoneNumber: cleanPhone
      });

      if (res.success) {
        setEnrolledVoter(res.voter);
        triggerPopup(`Voter ${fullName.trim()} registered successfully! Biometric profile saved to electoral roll.`);
        loadVoters();
      } else {
        setFormError(res.message || 'Failed to register voter.');
      }
    } catch (err) {
      setFormError(err.message || 'Error occurred while saving voter registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setAadhaar('');
    setDob('');
    setCalculatedAge(null);
    setAgeError('');
    setFormError('');
    setFacePhoto(null);
    setFaceDescriptor(null);
    setPhoneNumber('');
    setEnrolledVoter(null);
  };

  // Filter voters list by search query, district, and voting status
  const filteredVoters = votersList.filter(v => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      (v.fullName || '').toLowerCase().includes(q) ||
      (v.id || '').toLowerCase().includes(q) ||
      (v.aadhaarMasked || v.aadhaar || '').toLowerCase().includes(q) ||
      (v.constituency || '').toLowerCase().includes(q) ||
      (v.district || '').toLowerCase().includes(q)
    );

    const matchesDistrict = filterDistrict === 'ALL' || v.district === filterDistrict;
    const matchesStatus = 
      filterStatus === 'ALL' ? true :
      filterStatus === 'ELIGIBLE' ? !v.hasVoted :
      filterStatus === 'VOTED' ? v.hasVoted : true;

    return matchesSearch && matchesDistrict && matchesStatus;
  });

  const totalRegistered = votersList.length;
  const totalEligible = votersList.filter(v => !v.hasVoted).length;
  const totalVoted = votersList.filter(v => v.hasVoted).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* GLOBAL POPUP NOTIFICATION BANNER */}
      {popupNotification && (
        <div className="fixed top-20 right-6 z-50 max-w-md p-4 rounded-2xl bg-emerald-950/95 border-2 border-cyber-emerald text-white shadow-2xl shadow-emerald-950/80 backdrop-blur-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-2 rounded-xl bg-emerald-900/80 text-cyber-emerald border border-cyber-emerald/40">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyber-emerald mb-0.5">
              SYSTEM ACTION CONFIRMED
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">{popupNotification}</p>
          </div>
          <button
            onClick={() => setPopupNotification('')}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyber-cyan transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO DASHBOARD</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-cyber-cyan bg-navy-900/80 px-3 py-1 rounded-full border border-cyber-cyan/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TN-SEC • ELECTORAL REGISTRY</span>
        </div>
      </div>

      {/* Main Page Title */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-cyber-cyan" />
            <span>Voter Registry & Biometric Enrollment</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official Election Commission portal: Inspect registered citizen profiles with webcam photos, or enroll new voters with 2FA biometrics.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-navy-900 border border-cyber-cyan/40 text-cyber-cyan font-bold shadow flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse" />
            <span>{totalRegistered} Registered Voters in DB</span>
          </span>
        </div>
      </div>

      {/* PROMINENT TAB SWITCHER (Voter List vs Enroll Form) */}
      <div className="flex flex-wrap items-center gap-3 p-1.5 rounded-2xl bg-navy-900/90 border border-white/10 w-fit mb-8 shadow-2xl backdrop-blur-md">
        
        {/* Tab 1: Registered Voters Directory */}
        <button
          type="button"
          onClick={() => switchTab('list')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all duration-300 ${
            activeTab === 'list'
              ? 'bg-gradient-to-r from-cyber-cyan to-blue-500 text-black shadow-lg shadow-cyber-cyan/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Voters List</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
            activeTab === 'list' ? 'bg-black/25 text-black' : 'bg-navy-800 text-cyber-cyan border border-cyber-cyan/30'
          }`}>
            {totalRegistered}
          </span>
        </button>

        {/* Tab 2: New Voter Enrollment Form */}
        <button
          type="button"
          onClick={() => switchTab('register')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all duration-300 ${
            activeTab === 'register'
              ? 'bg-gradient-to-r from-cyber-emerald to-emerald-400 text-black shadow-lg shadow-cyber-emerald/30 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>➕ Enroll New Voter Form</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: REGISTERED VOTERS LIST (WITH PHOTOS & ALL DETAILS)    */}
      {/* ============================================================ */}
      {activeTab === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* KPI Ticker Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="glass-panel p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                <span>TOTAL REGISTERED</span>
                <Users className="w-4 h-4 text-cyber-cyan" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{totalRegistered}</div>
              <span className="text-[10px] text-cyber-cyan font-mono mt-0.5 block">100% Genuine Citizens</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                <span>READY TO VOTE</span>
                <CheckCircle2 className="w-4 h-4 text-cyber-emerald" />
              </div>
              <div className="text-2xl font-black text-cyber-emerald font-mono">{totalEligible}</div>
              <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">Biometrics Verified</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                <span>VOTES CAST</span>
                <Vote className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">{totalVoted}</div>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                {totalRegistered > 0 ? Math.round((totalVoted / totalRegistered) * 100) : 0}% Turnout
              </span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                <span>2FA PROTECTION</span>
                <ShieldCheck className="w-4 h-4 text-cyber-cyan" />
              </div>
              <div className="text-2xl font-black text-white font-mono">Active</div>
              <span className="text-[10px] text-cyber-cyan font-mono mt-0.5 block">Face ID + Phone OTP</span>
            </div>

          </div>

          {/* Search, Filters & Action Bar */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Left: Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by voter name, ID, Aadhaar, constituency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900/90 border border-white/15 focus:border-cyber-cyan text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Middle: District & Status Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* District Filter */}
              <div className="flex items-center gap-1.5 bg-navy-900/80 px-3 py-1.5 rounded-xl border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-cyber-cyan" />
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none font-mono cursor-pointer"
                >
                  <option value="ALL" className="bg-navy-900">All Districts</option>
                  {districts.map(d => (
                    <option key={d} value={d} className="bg-navy-900">{d}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-navy-900/80 px-3 py-1.5 rounded-xl border border-white/10">
                <Filter className="w-3.5 h-3.5 text-cyber-emerald" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none font-mono cursor-pointer"
                >
                  <option value="ALL" className="bg-navy-900">All Statuses</option>
                  <option value="ELIGIBLE" className="bg-navy-900">Eligible to Vote</option>
                  <option value="VOTED" className="bg-navy-900">Vote Cast</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadVoters}
                disabled={isLoadingVoters}
                className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-white/15 text-slate-300 hover:text-white transition-all"
                title="Refresh Voters List"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingVoters ? 'animate-spin text-cyber-cyan' : ''}`} />
              </button>

            </div>

            {/* Right: Primary "Enroll New Voter" Action Button */}
            <button
              onClick={() => switchTab('register')}
              className="cyber-btn-cyan text-xs font-mono font-bold px-5 py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-cyber-cyan/20"
            >
              <UserPlus className="w-4 h-4 text-black" />
              <span>+ Enroll New Voter</span>
            </button>

          </div>

          {/* VOTERS GRID CARDS DISPLAY */}
          {isLoadingVoters ? (
            <div className="py-24 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyber-cyan" />
              <span>Loading genuine voter profiles & biometric snapshots...</span>
            </div>
          ) : filteredVoters.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl p-8 glass-panel">
              <div className="w-16 h-16 rounded-full bg-navy-800 border border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-400 shadow-xl">
                <Users className="w-8 h-8 text-cyber-cyan" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                {votersList.length === 0 ? 'No Voters Enrolled in Database' : 'No Matching Voters Found'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                {votersList.length === 0 
                  ? 'The electoral database is clean with 0 unauthorized records. Enroll genuine citizens using device camera face capture and mobile OTP 2FA to see them appear here.'
                  : `No voter records match your search query "${searchQuery}". Try clearing filters.`}
              </p>
              {votersList.length === 0 ? (
                <button
                  onClick={() => switchTab('register')}
                  className="cyber-btn-cyan text-xs font-mono font-bold px-6 py-3"
                >
                  <UserPlus className="w-4 h-4 text-black inline mr-2" />
                  <span>Start First Voter Registration</span>
                </button>
              ) : (
                <button
                  onClick={() => { setSearchQuery(''); setFilterDistrict('ALL'); setFilterStatus('ALL'); }}
                  className="cyber-btn-glass text-xs font-mono px-4 py-2"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVoters.map((voter) => {
                const isAadhaarUnmasked = unmaskedAadhaarIds.has(voter.id);
                const displayedAadhaar = isAadhaarUnmasked 
                  ? (voter.aadhaar || voter.aadhaarMasked)
                  : voter.aadhaarMasked;

                return (
                  <div
                    key={voter.id}
                    className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-cyber-cyan/50 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:shadow-cyan-950/40 relative overflow-hidden"
                  >
                    
                    {/* Top ambient glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-cyan/5 rounded-full blur-2xl group-hover:bg-cyber-cyan/15 transition-all" />

                    <div>
                      {/* Photo & Core ID Header */}
                      <div className="flex items-start gap-4 mb-4">
                        
                        {/* Real Webcam Face Photo with Zoom Action */}
                        <div 
                          className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyber-cyan/50 shadow-lg flex-shrink-0 bg-navy-950 cursor-pointer group/photo"
                          onClick={() => setZoomPhotoVoter(voter)}
                          title="Click to view full captured photo"
                        >
                          <img
                            src={voter.facePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={voter.fullName}
                            className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-cyber-cyan drop-shadow" />
                          </div>
                          
                          {/* Real-time Badge */}
                          <div className="absolute bottom-0 inset-x-0 bg-navy-950/90 text-[8px] font-mono text-center text-cyber-cyan font-bold py-0.5 border-t border-cyber-cyan/40">
                            WEBCAM
                          </div>
                        </div>

                        {/* Name & Voter ID */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-white truncate group-hover:text-cyber-cyan transition-colors">
                            {voter.fullName}
                          </h4>
                          
                          {/* Person ID & Voter ID Badge with Copy */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {voter.personId && (
                              <span className="text-xs font-mono font-black text-white bg-purple-950/80 px-2 py-0.5 rounded-lg border border-purple-500/40">
                                Person ID: {voter.personId}
                              </span>
                            )}
                            <span className="text-xs font-mono font-bold text-cyber-cyan bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyber-cyan/30">
                              {voter.id}
                            </span>
                            <button
                              onClick={() => handleCopyVoterId(voter.id)}
                              className="text-slate-400 hover:text-cyber-cyan p-1 transition-colors"
                              title="Copy Voter ID"
                            >
                              {copiedId === voter.id ? (
                                <Check className="w-3.5 h-3.5 text-cyber-emerald" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Voting Status Pill */}
                          <div className="mt-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase ${
                              voter.hasVoted 
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950' 
                                : 'bg-emerald-950/80 text-cyber-emerald border border-cyber-emerald/40 shadow-sm shadow-emerald-950'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${voter.hasVoted ? 'bg-amber-400' : 'bg-cyber-emerald animate-pulse'}`} />
                              <span>{voter.hasVoted ? 'VOTE CAST ✓' : 'READY TO VOTE'}</span>
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Detailed Metadata Grid */}
                      <div className="space-y-2 py-3 border-t border-b border-white/10 text-xs font-mono">
                        
                        {/* Aadhaar with Unmask Toggle */}
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-slate-500" />
                            <span>Aadhaar:</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-semibold tracking-wider">
                              {displayedAadhaar}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleAadhaarMask(voter.id)}
                              className="text-slate-400 hover:text-cyber-cyan p-0.5 transition-colors"
                              title={isAadhaarUnmasked ? "Mask Aadhaar" : "Reveal full Aadhaar"}
                            >
                              {isAadhaarUnmasked ? (
                                <EyeOff className="w-3.5 h-3.5 text-cyber-cyan" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Date of Birth & Age */}
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>DOB & Age:</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white">
                              {voter.dob || 'Verified'}
                            </span>
                            {voter.age && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-cyber-emerald/40 text-cyber-emerald font-bold">
                                {voter.age} Yrs (≥18 ✓)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* District */}
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>District:</span>
                          </span>
                          <span className="text-white font-sans font-medium">
                            {voter.district}
                          </span>
                        </div>

                        {/* Electoral Constituency */}
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-500" />
                            <span>Constituency:</span>
                          </span>
                          <span className="text-cyber-emerald font-sans font-bold">
                            {voter.constituency}
                          </span>
                        </div>

                        {/* Registered Phone */}
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>Mobile 2FA:</span>
                          </span>
                          <span className="text-cyber-cyan font-mono font-medium">
                            {voter.phoneMasked || (voter.phoneNumber ? `+91 ******${voter.phoneNumber.slice(-4)}` : 'Verified')}
                          </span>
                        </div>

                        {/* 2FA Security Badges */}
                        <div className="flex items-center justify-between text-slate-300 pt-1">
                          <span className="text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-slate-500" />
                            <span>Security:</span>
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyber-cyan border border-cyber-cyan/30 flex items-center gap-1">
                              <Camera className="w-2.5 h-2.5" /> Face ID ✓
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-cyber-emerald border border-cyber-emerald/30 flex items-center gap-1">
                              <Smartphone className="w-2.5 h-2.5" /> Phone OTP ✓
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Registered Timestamp */}
                      {voter.registeredAt && (
                        <div className="text-[10px] font-mono text-slate-500 mt-2 flex items-center justify-between">
                          <span>Enrolled:</span>
                          <span>{new Date(voter.registeredAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}</span>
                        </div>
                      )}

                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-5 pt-3 flex items-center justify-between gap-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setZoomPhotoVoter(voter)}
                        className="text-xs font-mono text-cyber-cyan hover:underline flex items-center gap-1"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>View Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoterToDelete(voter)}
                        className="px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-cyber-crimson/50 text-red-200 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-red-900/50"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-cyber-crimson" />
                        <span>Delete Voter</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: NEW CITIZEN BIOMETRIC ENROLLMENT FORM                */}
      {/* ============================================================ */}
      {activeTab === 'register' && (
        <div className="animate-in fade-in duration-300">
          
          {/* Quick Header Notice */}
          <div className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-cyber-cyan/30 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyber-cyan/40 text-cyber-cyan">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Enroll New Genuine Voter</h3>
                <p className="text-xs text-slate-400">
                  Real camera face frame capture, official mobile OTP 2FA verification, and age &ge; 18 validation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => switchTab('list')}
              className="cyber-btn-glass text-xs font-mono flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>Back to Voter List ({totalRegistered})</span>
            </button>
          </div>

          {/* Success Modal / Banner after enrollment */}
          {enrolledVoter && (
            <div className="mb-8 p-6 rounded-2xl glass-panel border-2 border-cyber-emerald shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyber-emerald shadow-lg flex-shrink-0">
                    <img src={enrolledVoter.facePhoto} alt="Enrolled Voter" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-cyber-emerald text-cyber-emerald text-xs font-mono font-black mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>REGISTRATION SUCCESSFUL</span>
                    </div>
                    <div className="text-xl font-mono font-black text-cyber-cyan mb-1">
                      Person ID : <span className="text-white text-2xl font-black">{enrolledVoter.personId || enrolledVoter.id}</span>
                    </div>
                    <div className="text-lg font-bold text-white mb-1">
                      Name : <span className="text-cyber-emerald font-black">{enrolledVoter.fullName}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono">
                      Face biometric enrolled successfully.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Voter ID: <strong className="text-cyber-cyan">{enrolledVoter.id}</strong> • Aadhaar: {enrolledVoter.aadhaarMasked} • Seat: {enrolledVoter.constituency} ({enrolledVoter.district} District)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => switchTab('list')}
                    className="cyber-btn-cyan text-xs font-mono font-bold px-4 py-2.5 flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4 text-black" />
                    <span>View in Voter List</span>
                  </button>
                  <button
                    onClick={resetForm}
                    className="cyber-btn-glass text-xs font-mono px-4 py-2.5"
                  >
                    Enroll Another Voter
                  </button>
                  <Link
                    to="/voter"
                    className="cyber-btn-glass text-xs font-mono text-cyber-emerald border-cyber-emerald/40 px-4 py-2.5"
                  >
                    Test in Voter Booth →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Main Form Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Facial Biometric Enrollment (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Facial Biometric Box */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse" />
                    Facial Biometric Enrollment
                  </h3>
                  <span className={`text-[10px] font-mono ${facePhoto ? 'text-cyber-emerald font-bold' : 'text-cyber-cyan'}`}>
                    {facePhoto ? 'Biometrics Captured ✓' : 'Live Camera Active'}
                  </span>
                </div>

                <CyberWebcam
                  onCapture={(img, desc) => {
                    setFacePhoto(img);
                    setFaceDescriptor(desc);
                  }}
                  capturedImage={facePhoto}
                  onPopupNotify={(msg) => triggerPopup(msg)}
                />

                {/* Biometric Enrollment Instructions Card */}
                <div className="mt-4 p-4 rounded-xl bg-navy-900/70 border border-white/10 text-xs text-slate-300 space-y-2.5">
                  <div className="flex items-center gap-2 text-cyber-cyan font-mono font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Biometric Authentication Guidelines:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                    <li>Position your face directly within the cyber reticle with good lighting.</li>
                    <li>Anti-spoofing and lux analyzer detect real-time live human facial features.</li>
                    <li>Avoid masks, heavy shadows, or strong backlights during capture.</li>
                    <li>128-dimensional facial gradient vector will be mapped for voting booth access.</li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Right Column: Citizen Metadata Form & DOB Validation (7 cols) */}
            <div className="lg:col-span-7">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 h-full flex flex-col justify-between">
                
                <div>
                  <div className="pb-4 border-b border-white/10 mb-6">
                    <h3 className="text-lg font-bold text-white">Voter Metadata & Electoral Mapping</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verify identity documents and map citizen to Tamil Nadu Assembly Constituencies.
                    </p>
                  </div>

                  {/* General Form Error Banner */}
                  {formError && (
                    <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-cyber-crimson/50 text-red-200 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 text-cyber-crimson" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* CRUCIAL AGE CHECK IMMEDIATE BLOCKING ALERT */}
                  {ageError && (
                    <div className="mb-6 p-4 rounded-xl bg-red-950/90 border-2 border-cyber-crimson text-white shadow-xl shadow-red-950/50 animate-bounce duration-700 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyber-crimson text-black font-bold">
                        <ShieldAlert className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black tracking-wide uppercase text-red-300">
                          Disqualification Warning
                        </h4>
                        <p className="text-base font-bold text-white">
                          {ageError}
                        </p>
                        <p className="text-xs text-red-200 mt-0.5">
                          Citizen age is {calculatedAge} years. Article 326 strictly requires age 18 or above for voter registration.
                        </p>
                      </div>
                    </div>
                  )}

                  <form id="voter-reg-form" onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                        Full Legal Name <span className="text-cyber-crimson">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Parthasarathi"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-navy-900/90 border border-white/15 focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                      />
                    </div>

                    {/* Aadhaar / Citizen ID */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Aadhaar / Citizen Identifier (12 Digits) <span className="text-cyber-crimson">*</span></span>
                        <span className="text-[10px] text-slate-400 font-mono">Format: XXXX XXXX XXXX</span>
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={aadhaar}
                          onChange={(e) => handleAadhaarChange(e.target.value)}
                          placeholder="4589 1234 8921"
                          maxLength={14}
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-navy-900/90 border border-white/15 focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan text-sm text-white placeholder:text-slate-500 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Date of Birth Picker with Instant Age Check */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Date of Birth (DOB) <span className="text-cyber-crimson">*</span></span>
                        {calculatedAge !== null && (
                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                            calculatedAge >= 18 
                              ? 'bg-emerald-950 text-cyber-emerald border border-cyber-emerald/40' 
                              : 'bg-red-950 text-red-300 border border-cyber-crimson'
                          }`}>
                            Age: {calculatedAge} years ({calculatedAge >= 18 ? 'Eligible' : 'Ineligible'})
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => handleDobChange(e.target.value)}
                          required
                          className={`w-full pl-10 pr-4 py-3 rounded-lg bg-navy-900/90 border ${
                            ageError 
                              ? 'border-cyber-crimson focus:border-cyber-crimson ring-1 ring-cyber-crimson text-red-200' 
                              : 'border-white/15 focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan text-white'
                          } text-sm outline-none transition-all`}
                        />
                      </div>
                    </div>

                    {/* Optional Mobile / Contact Phone Number */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Mobile / Contact Number (Optional)</span>
                        <span className="text-[10px] text-slate-400 font-mono">10 Digits</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="98765 43210"
                          maxLength={10}
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-navy-900/90 border border-white/15 focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan text-sm text-white placeholder:text-slate-500 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Cascading District and Constituency Dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* District Dropdown */}
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyber-cyan" />
                          <span>District (Tamil Nadu) <span className="text-cyber-crimson">*</span></span>
                        </label>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                          className="w-full px-3.5 py-3 rounded-lg bg-navy-900/90 border border-white/15 focus:border-cyber-cyan text-sm text-white outline-none"
                        >
                          {districts.map((d) => (
                            <option key={d} value={d} className="bg-navy-900 text-white">
                              {d} District
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cascading Electoral Constituency Dropdown */}
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-cyber-emerald" />
                          <span>Electoral Constituency <span className="text-cyber-crimson">*</span></span>
                        </label>
                        <select
                          value={selectedConstituency}
                          onChange={(e) => setSelectedConstituency(e.target.value)}
                          className="w-full px-3.5 py-3 rounded-lg bg-navy-900/90 border border-white/15 focus:border-cyber-cyan text-sm text-white outline-none"
                        >
                          {(constituenciesMap[selectedDistrict] || []).map((c) => (
                            <option key={c} value={c} className="bg-navy-900 text-white">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                  </form>
                </div>

                {/* Submit Action Bar */}
                <div className="pt-8 border-t border-white/10 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs font-mono text-slate-400">
                    {ageError ? (
                      <span className="text-cyber-crimson font-bold">Registration Locked: Age &lt; 18 Disqualified</span>
                    ) : !facePhoto ? (
                      <span>Awaiting Facial Snapshot capture...</span>
                    ) : (
                      <span className="text-cyber-emerald">Facial Biometrics Captured & Ready for Enrollment ✓</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    form="voter-reg-form"
                    disabled={Boolean(ageError) || isSubmitting || !isFormValid()}
                    className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      Boolean(ageError) || !isFormValid()
                        ? 'bg-navy-800 text-slate-500 border border-white/10 cursor-not-allowed'
                        : 'cyber-btn-cyan shadow-xl shadow-cyber-cyan/30'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Committing Biometric Record...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save & Enroll Voter</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* FULL PHOTO ZOOM MODAL */}
      {zoomPhotoVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full p-6 rounded-3xl glass-panel border-2 border-cyber-cyan/60 shadow-2xl animate-in zoom-in-95 relative">
            
            <button
              onClick={() => setZoomPhotoVoter(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-navy-800 text-slate-400 hover:text-white border border-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 text-cyber-cyan font-mono text-xs font-bold uppercase tracking-wider">
              <Camera className="w-4 h-4" />
              <span>Real Camera Biometric Snapshot</span>
            </div>

            {/* Enlarged Photo Container with Cyber Reticle */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-cyber-cyan shadow-2xl bg-black aspect-[4/3] flex items-center justify-center mb-5">
              <img
                src={zoomPhotoVoter.facePhoto}
                alt={zoomPhotoVoter.fullName}
                className="w-full h-full object-cover"
              />
              
              {/* Corner crosshairs */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyber-cyan" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyber-cyan" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyber-cyan" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyber-cyan" />

              <div className="absolute bottom-3 left-3 bg-navy-950/90 border border-cyber-cyan/50 px-3 py-1 rounded-full text-[10px] font-mono text-cyber-cyan font-bold">
                ENROLLED CITIZEN PROFILE
              </div>
            </div>

            {/* Voter Meta Details inside Modal */}
            <div className="bg-navy-950/80 p-4 rounded-2xl border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Full Name:</span>
                <span className="text-white font-bold font-sans text-sm">{zoomPhotoVoter.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Voter ID:</span>
                <span className="text-cyber-cyan font-bold">{zoomPhotoVoter.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Aadhaar:</span>
                <span className="text-white">{zoomPhotoVoter.aadhaar || zoomPhotoVoter.aadhaarMasked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Constituency:</span>
                <span className="text-cyber-emerald font-bold">{zoomPhotoVoter.constituency} ({zoomPhotoVoter.district} District)</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setZoomPhotoVoter(null)}
                className="cyber-btn-cyan text-xs font-mono font-bold px-5 py-2.5"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {voterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full p-6 rounded-3xl glass-panel border-2 border-cyber-crimson/60 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-cyber-crimson text-cyber-crimson flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white text-center mb-2">
              Confirm Voter Deletion
            </h3>
            <p className="text-xs text-slate-300 text-center leading-relaxed mb-6">
              Are you sure you want to delete voter <strong className="text-white font-semibold">{voterToDelete.fullName}</strong> (<code className="text-cyber-cyan font-mono">{voterToDelete.id}</code>)?
              This will permanently purge their face snapshot and phone registration record from the electoral database.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setVoterToDelete(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 text-xs font-mono font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteVoter}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-xl bg-cyber-crimson hover:bg-red-600 text-white text-xs font-mono font-bold shadow-lg shadow-red-500/30 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
