import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, UserCheck, AlertTriangle, CheckCircle2, Lock, 
  ArrowRight, RefreshCw, Smartphone, Phone, Camera, Award, FileCheck, LogOut, Loader2,
  ShieldAlert, X, Send, KeyRound, Sparkles, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import CyberWebcam from '../components/CyberWebcam';
import PartySymbol, { getPartyInfo } from '../components/PartySymbol';

export default function VoterBooth() {
  // Authentication Steps: 'VERIFYING_FACE' -> 'BALLOT' -> 'CONFIRM_MODAL' -> 'VOTE_SUCCESS'
  const [authStep, setAuthStep] = useState('VERIFYING_FACE');
  const [voter, setVoter] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState(null);
  const [duplicateVoteError, setDuplicateVoteError] = useState('');
  const [authError, setAuthError] = useState('');
  const [unauthorizedAlert, setUnauthorizedAlert] = useState(null);
  const [registeredVotersList, setRegisteredVotersList] = useState([]);
  const [selectedTestVoterId, setSelectedTestVoterId] = useState('');

  // Election active status
  const [pollStatus, setPollStatus] = useState({ isOpen: true, reason: '' });

  useEffect(() => {
    checkPollsAndVoters();
  }, []);

  const checkPollsAndVoters = async () => {
    try {
      const [configRes, votersRes] = await Promise.all([
        api.getElectionConfig().catch(() => ({ status: { isOpen: true } })),
        api.getVoters().catch(() => ({ voters: [] }))
      ]);

      if (configRes.status) setPollStatus(configRes.status);
      if (votersRes.voters) {
        setRegisteredVotersList(votersRes.voters);
      }
    } catch (err) {
      console.error('Initial check failed:', err);
    }
  };

  // Trigger dedicated Unauthorized User Security Alert
  const handleUnauthorizedAccess = (msg, capturedImg = null) => {
    setUnauthorizedAlert({
      title: 'UNKNOWN',
      subtitle: 'Please scan again.',
      tamilTitle: 'அடையாளம் காணப்படவில்லை / தயவுசெய்து மீண்டும் ஸ்கேன் செய்யவும்',
      message: 'UNKNOWN - Please scan again.',
      tamilDescription: 'உங்கள் முகம் மாநில தேர்தல் ஆணையத்தின் வாக்காளர் பட்டியலில் பதிவு செய்யப்படவில்லை. பதிவு செய்யப்பட்ட உண்மையான வாக்காளர்கள் மட்டுமே வாக்களிக்க முடியும்.',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      capturedPhoto: capturedImg
    });
  };

  // Face Verification Handler (Biometric Step)
  const handleFaceCaptured = async (imageData, descriptor) => {
    if (!imageData) return;
    setAuthError('');
    setUnauthorizedAlert(null);

    // If simulated unauthorized test clicked
    if (imageData === 'UNAUTHORIZED_TEST') {
      handleUnauthorizedAccess('UNKNOWN - Please scan again.');
      return;
    }

    try {
      // Send face snapshot & descriptor to backend
      const res = await api.verifyFace(imageData, descriptor, selectedTestVoterId || null);
      if (res.success && res.voter) {
        // Pre-check duplicate vote
        if (res.voter.hasVoted) {
          setVoter(res.voter);
          setDuplicateVoteError('Duplicate Vote Detected: You have already cast your ballot for this election.');
          setAuthStep('BALLOT');
          return;
        }

        // Face Biometrics Authenticated! Directly unlock voter booth & ballot
        setVoter(res.voter);
        unlockVoterBooth(res.voter);
      } else {
        handleUnauthorizedAccess(res.message, imageData);
      }
    } catch (err) {
      const errMsg = err.data?.message || err.message || 'UNAUTHORIZED USER: Facial verification could not find this biometric in electoral roll.';
      handleUnauthorizedAccess(errMsg, imageData);
    }
  };

  // Unlock Voter Booth & Fetch Candidates ONLY for voter's constituency (Ballot Step)
  const unlockVoterBooth = async (voterProfile) => {
    setVoter(voterProfile);

    // ANTI-FRAUD PRE-CHECK: If voter already voted, immediately show duplicate vote lock
    if (voterProfile.hasVoted) {
      setDuplicateVoteError('Duplicate Vote Detected: You have already cast your ballot for this election.');
      setAuthStep('BALLOT');
      return;
    }

    try {
      // Fetch ONLY candidates for voter's registered constituency!
      const res = await api.getCandidates({
        constituency: voterProfile.constituency
      });

      setCandidates(res.candidates || []);
      setAuthStep('BALLOT');
    } catch (err) {
      setAuthError('Failed to fetch constituency candidates.');
    }
  };

  // Vote Cast Handler (Step 4)
  const handleCastVote = async () => {
    if (!voter || !selectedCandidate) return;

    setIsSubmittingVote(true);
    setDuplicateVoteError('');

    try {
      const res = await api.castVote(voter.id, selectedCandidate.id);
      if (res.success) {
        setVoteReceipt(res.receipt);
        setShowConfirmModal(false);
        setAuthStep('VOTE_SUCCESS');
        
        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      // Check for Anti-Fraud Duplicate Vote Error
      if (err.status === 409 || err.message.includes('Duplicate Vote')) {
        setDuplicateVoteError('Duplicate Vote Detected: You have already cast your ballot for this election.');
        setShowConfirmModal(false);
      } else {
        alert(err.message || 'Error occurred casting ballot.');
      }
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleExit = () => {
    setVoter(null);
    setSelectedCandidate(null);
    setVoteReceipt(null);
    setDuplicateVoteError('');
    setAuthError('');
    setSelectedTestVoterId('');
    setAuthStep('VERIFYING_FACE');
    checkPollsAndVoters();
  };

  // HARD POLL LOCK BANNER: If polls are locked outside election hours
  if (!pollStatus.isOpen) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border-2 border-cyber-crimson text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-950 border-2 border-cyber-crimson flex items-center justify-center mx-auto mb-4 text-cyber-crimson">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Voting Booth Locked</h2>
          <p className="text-xs text-red-300 mb-4">{pollStatus.reason}</p>
          <p className="text-xs text-slate-400">
            Official polling hours are strictly monitored. Please return during active polling window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* STEP 1: REAL-TIME FACE BIOMETRIC VERIFICATION */}
      {authStep === 'VERIFYING_FACE' && (
        <div className="max-w-3xl mx-auto">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800/80 border border-cyber-cyan/40 text-cyber-cyan text-xs font-mono font-semibold mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>REAL-TIME FACIAL BIOMETRIC VERIFICATION • DIRECT BALLOT ACCESS</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Biometric Voter Authentication Booth
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Position your face directly in the cyber reticle with adequate lighting to verify your identity and unlock voting access.
            </p>
          </div>

          {/* Optional Voter Identity Input for fast pinpoint lookup */}
          <div className="mb-6 p-4 rounded-xl bg-navy-900/80 border border-white/10 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs font-mono">
                <span className="text-cyber-cyan font-bold block">CITIZEN VERIFICATION BOOTH:</span>
                <span className="text-slate-400">Automatic 1:N Facial Recognition Active • Or enter Voter ID / Aadhaar:</span>
              </div>
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  list="enrolled-voters-list"
                  placeholder="e.g. VOTER-TN-... or Aadhaar"
                  value={selectedTestVoterId}
                  onChange={(e) => setSelectedTestVoterId(e.target.value)}
                  className="px-3.5 py-2 pr-8 rounded-lg bg-navy-950 border border-white/20 focus:border-cyber-cyan text-xs font-mono text-white outline-none w-full placeholder-slate-500"
                />
                <datalist id="enrolled-voters-list">
                  {registeredVotersList.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.fullName} (Aadhaar: {v.aadhaarMasked || v.aadhaar})
                    </option>
                  ))}
                </datalist>
                {selectedTestVoterId && (
                  <button
                    type="button"
                    onClick={() => setSelectedTestVoterId('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-0.5"
                    title="Clear hint for automatic 1:N matching"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Test Voter Selection Pills */}
            {registeredVotersList.length > 0 && (
              <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">Quick Test Registered Voters:</span>
                {registeredVotersList.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedTestVoterId(v.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
                      selectedTestVoterId === v.id
                        ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan font-bold shadow-sm'
                        : 'bg-navy-950/60 hover:bg-navy-800 border-white/10 text-slate-300'
                    }`}
                  >
                    {v.fullName} ({v.id})
                  </button>
                ))}
                {selectedTestVoterId && (
                  <button
                    type="button"
                    onClick={() => setSelectedTestVoterId('')}
                    className="px-2 py-1 rounded-md text-[10px] font-mono bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300"
                  >
                    Clear Filter (1:N Mode)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* UNAUTHORIZED USER PROMINENT ALERT BANNER */}
          {unauthorizedAlert && (
            <div className="mb-6 p-5 rounded-2xl bg-red-950/95 border-2 border-cyber-crimson text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] flex items-start gap-4 animate-in shake duration-300">
              <div className="p-2.5 rounded-xl bg-red-900 border border-cyber-crimson text-cyber-crimson flex-shrink-0 animate-pulse">
                <ShieldAlert className="w-7 h-7 text-cyber-crimson" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyber-crimson text-black text-[10px] font-mono font-black uppercase tracking-wider">
                    SCAN REJECTED
                  </span>
                  <span className="text-xs font-mono font-bold text-red-300">
                    NOT RECOGNIZED
                  </span>
                </div>
                <h4 className="text-2xl font-black text-white tracking-tight font-mono">
                  UNKNOWN
                </h4>
                <p className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                  Please scan again.
                </p>
                <p className="text-xs text-slate-300 mt-2 font-mono leading-relaxed">
                  Facial biometric does not match any registered voter in the electoral database.
                </p>
                <div className="mt-3 pt-2 border-t border-red-900/60 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setUnauthorizedAlert(null)}
                    className="px-5 py-2 rounded-xl bg-red-900 hover:bg-red-800 border border-red-400 text-white text-xs font-mono font-bold transition-all shadow"
                  >
                    Please scan again (Retry)
                  </button>
                </div>
              </div>
              <button
                onClick={() => setUnauthorizedAlert(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Auth Error Banner */}
          {authError && !unauthorizedAlert && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-cyber-crimson/50 text-red-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyber-crimson flex-shrink-0" />
                <span>{authError}</span>
              </div>
            </div>
          )}

          {/* Active Facial Biometric Scan Widget */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl">
            <CyberWebcam
              onCapture={handleFaceCaptured}
              isVerifying={true}
            />
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyber-emerald animate-pulse" />
                <span>Real-time Anti-Spoofing & Lux Validator Active</span>
              </span>
              <span className="text-cyber-cyan">Threshold: Real-Time Biometric Match (≥ 70%)</span>
            </div>
          </div>

        </div>
      )}



      {/* STEP 3: FRAUD-PROOF BALLOT INTERFACE (Only revealed after voter authentication) */}
      {authStep === 'BALLOT' && voter && (
        <div>
          
          {/* VERIFIED VOTER PROFILE HEADER (Masks all other records completely!) */}
          <div className="glass-panel p-6 rounded-2xl border border-cyber-cyan/40 shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-cyber-cyan shadow-lg shadow-cyber-cyan/20 flex-shrink-0">
                <img src={voter.facePhoto} alt={voter.fullName} className="w-full h-full object-cover" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-950 border border-cyber-emerald text-cyber-emerald font-black">
                    MATCHED ✓
                  </span>
                  {voter.personId && (
                    <span className="text-xs font-mono font-black text-white bg-purple-950/90 px-3 py-1 rounded-full border border-purple-500/50 shadow">
                      Person ID : {voter.personId}
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400">ID: {voter.id}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white mt-1">
                  Name : <span className="text-cyber-cyan font-black">{voter.fullName}</span>
                </h2>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Aadhaar: <span className="text-white">{voter.aadhaarMasked}</span> • Registered Seat: <strong className="text-cyber-cyan">{voter.constituency}</strong> ({voter.district} District)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExit}
                className="cyber-btn-glass text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Booth</span>
              </button>
            </div>

          </div>

          {/* DUPLICATE VOTE WARNING BADGE (Anti-Fraud Engine) */}
          {duplicateVoteError && (
            <div className="mb-8 p-6 rounded-2xl bg-red-950/90 border-2 border-cyber-crimson shadow-2xl animate-in zoom-in duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-cyber-crimson text-black font-bold flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-black" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-900 border border-cyber-crimson text-white text-xs font-mono font-bold uppercase mb-1">
                    ANTI-FRAUD SECURITY PROTOCOL ENGAGED
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {duplicateVoteError}
                  </h3>
                  <p className="text-xs text-red-200 mt-1 max-w-2xl leading-relaxed">
                    Our cryptographic ledger confirms that a valid ballot has already been recorded for your citizen identifier. Under State Election Commission rules, duplicate votes are strictly prohibited and discarded.
                  </p>
                  <button
                    onClick={handleExit}
                    className="mt-4 cyber-btn-glass text-xs"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CANDIDATE BALLOT CARDS (Only candidates for voter's specific constituency) */}
          {!duplicateVoteError && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Official Ballot: {voter.constituency} Assembly Constituency
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select your chosen candidate below. All ballots are encrypted with SHA-256 digital signatures.
                  </p>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-navy-900 border border-white/15 text-cyber-cyan">
                  {candidates.length} Contesting Candidates
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`glass-panel p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] ${
                      selectedCandidate?.id === candidate.id
                        ? 'border-cyber-cyan bg-cyan-950/30 shadow-2xl shadow-cyber-cyan/20'
                        : 'border-white/10 hover:border-cyber-cyan/40'
                    }`}
                  >
                    <div>
                      {/* Candidate Header & Symbol */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-navy-900 border border-white/15 flex-shrink-0">
                          <img
                            src={candidate.photoUrl}
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col items-center p-1.5 rounded-xl bg-navy-900/90 border border-white/10">
                          <PartySymbol
                            party={candidate.party}
                            symbolUrl={candidate.symbolUrl}
                            className="w-10 h-10"
                            showLabel={true}
                          />
                        </div>

                      </div>

                      {/* Candidate Name & Party */}
                      <h4 className="text-lg font-bold text-white">{candidate.name}</h4>
                      <div className="flex items-center gap-2 mt-1 mb-2">
                        <span
                          className="text-xs font-mono px-2.5 py-0.5 rounded-full font-bold"
                          style={{
                            backgroundColor: `${candidate.themeColor}20`,
                            color: candidate.themeColor,
                            borderColor: `${candidate.themeColor}60`,
                            borderWidth: '1px'
                          }}
                        >
                          {candidate.party}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {candidate.constituency}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setShowConfirmModal(true);
                        }}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          selectedCandidate?.id === candidate.id
                            ? 'cyber-btn-cyan shadow-lg shadow-cyber-cyan/30'
                            : 'cyber-btn-glass'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        <span>Vote for {candidate.party}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 sm:p-8 border border-cyber-cyan/40 shadow-2xl">
            <h3 className="text-xl font-black text-white text-center mb-1">
              Confirm Ballot Submission
            </h3>
            <p className="text-xs text-slate-400 text-center mb-6">
              Please verify your selected candidate before final cryptographic commitment.
            </p>

            <div className="p-4 rounded-xl bg-navy-900/90 border border-cyber-cyan/30 mb-6 flex items-center gap-4">
              <PartySymbol
                party={selectedCandidate.party}
                symbolUrl={selectedCandidate.symbolUrl}
                className="w-16 h-16"
                showLabel={true}
                labelClassName="text-cyber-cyan font-bold"
              />
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white">{selectedCandidate.name}</h4>
                <p className="text-sm font-mono text-cyber-cyan font-bold flex items-center gap-1.5">
                  <span>{selectedCandidate.party}</span>
                  {getPartyInfo(selectedCandidate.party)?.tamilName && (
                    <span className="text-xs text-slate-300 font-normal">
                      • {getPartyInfo(selectedCandidate.party).tamilName}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedCandidate.constituency} தொகுதி</p>
              </div>
            </div>


            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-navy-800 border border-white/10"
              >
                Change Choice
              </button>

              <button
                type="button"
                onClick={handleCastVote}
                disabled={isSubmittingVote}
                className="w-1/2 cyber-btn-cyan py-3 text-xs"
              >
                {isSubmittingVote ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Signing Vote...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Confirm Vote</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: CELEBRATORY CONFIRMATION SCREEN WITH DIGITAL RECEIPT */}
      {authStep === 'VOTE_SUCCESS' && voteReceipt && (
        <div className="max-w-xl mx-auto text-center py-10 animate-in zoom-in-95 duration-500">
          
          <div className="w-20 h-20 rounded-full bg-emerald-950/80 border-2 border-cyber-emerald flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cyber-emerald/40 text-cyber-emerald">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            Vote Cast Successfully!
          </h2>
          <p className="text-base text-cyber-emeraldLight font-medium mb-8">
            Thank you for exercising your democratic duty!
          </p>

          {/* Cryptographic Digital Vote Receipt Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-emerald/40 text-left shadow-2xl mb-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyber-emerald" />
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Cryptographic Digital Ballot Receipt
                </h4>
              </div>
              <span className="text-[10px] font-mono text-cyber-emerald bg-emerald-950 px-2 py-0.5 rounded border border-cyber-emerald/30">
                LEDGER COMMITTED
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Voter:</span>
                <span className="text-white font-bold">{voteReceipt.voterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Constituency:</span>
                <span className="text-cyber-cyan">{voteReceipt.constituency} ({voteReceipt.district})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chosen Candidate:</span>
                <span className="text-white">{voteReceipt.candidateName}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Party / சின்னம்:</span>
                <div className="flex items-center gap-2">
                  <PartySymbol party={voteReceipt.partyName} className="w-8 h-8" />
                  <span className="text-cyber-emerald font-bold">
                    {voteReceipt.partyName}
                    {getPartyInfo(voteReceipt.partyName)?.tamilName ? ` • ${getPartyInfo(voteReceipt.partyName).tamilName}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-300">{new Date(voteReceipt.timestamp).toLocaleString()}</span>
              </div>

              <div className="pt-3 border-t border-white/10">
                <span className="text-[10px] text-slate-400 block mb-1">SHA-256 RECEIPT HASH:</span>
                <p className="text-[10px] text-slate-300 break-all bg-black/40 p-2 rounded border border-white/5">
                  {voteReceipt.receiptHash}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleExit}
              className="cyber-btn-cyan text-xs px-8 py-3"
            >
              Finish & Return to Gateway
            </button>
          </div>

        </div>
      )}

      {/* DEDICATED UNAUTHORIZED USER SECURITY DIALOG MODAL */}
      {unauthorizedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-navy-950 border-2 border-cyber-crimson shadow-[0_0_60px_rgba(239,68,68,0.5)] animate-in zoom-in-95 relative text-center">
            
            {/* Flashing Security Siren */}
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-2xl bg-red-600/30 animate-ping" />
              <div className="relative w-full h-full rounded-2xl bg-red-950 border-2 border-cyber-crimson flex items-center justify-center text-cyber-crimson shadow-2xl">
                <ShieldAlert className="w-10 h-10 text-cyber-crimson" />
              </div>
            </div>

            {/* Alert Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-950 border border-cyber-crimson text-cyber-crimson text-xs font-mono font-black tracking-widest uppercase mb-3">
              <span>SECURITY ALERT • ACCESS DENIED</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
              {unauthorizedAlert.title}
            </h3>
            
            <p className="text-sm font-bold text-cyber-crimson mb-4 font-sans">
              {unauthorizedAlert.tamilTitle}
            </p>

            <div className="p-4 rounded-2xl bg-red-950/40 border border-cyber-crimson/40 text-xs font-mono text-slate-200 text-left space-y-2 mb-6">
              <p className="text-red-300 font-bold leading-relaxed">{unauthorizedAlert.message}</p>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{unauthorizedAlert.tamilDescription}</p>
              
              <div className="pt-2.5 border-t border-red-900/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>Verification Result:</span>
                <span className="text-cyber-crimson font-mono font-bold">REJECTED / UNREGISTERED</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Audit Timestamp:</span>
                <span className="text-white font-mono">{unauthorizedAlert.timestamp} IST</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setUnauthorizedAlert(null)}
                className="w-full sm:w-auto px-8 py-3 rounded-xl cyber-btn-cyan text-xs font-mono font-bold"
              >
                Dismiss & Re-scan Face
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
