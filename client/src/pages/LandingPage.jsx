import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Vote, Settings, BarChart3, Smartphone, Camera, Lock, 
  ArrowRight, CheckCircle2, Award, Users, AlertTriangle, Cpu, Layers, 
  Radio, Mail, FileSpreadsheet, Sparkles, Calendar, Clock, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export default function LandingPage() {
  const [pollStatus, setPollStatus] = useState({ isOpen: true, reason: '' });

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const configRes = await api.getElectionConfig().catch(() => null);
        if (configRes?.status) setPollStatus(configRes.status);
      } catch (err) {
        console.warn('Config fetch skipped:', err);
      }
    };
    loadOverview();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden selection:bg-cyber-cyan selection:text-black">
      
      {/* Background Gradient Meshes & Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-cyan-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-2/3 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[300px] bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto pt-6 pb-16">
          
          {/* Futuristic Cyber Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-navy-800/90 border border-cyber-cyan/40 text-cyber-cyan text-xs font-mono font-semibold tracking-wider uppercase mb-8 shadow-xl shadow-cyber-cyan/15 backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-cyan" />
            </span>
            <ShieldCheck className="w-4 h-4 text-cyber-cyan" />
            <span>Tamil Nadu Legislative Assembly General Election 2026</span>
          </div>

          {/* Hero Typography */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
            Next-Gen E-Voting with <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-teal-300 to-cyber-emerald">
              Biometric Fraud Defense
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Zero-fraud electronic voting secured by <strong className="text-cyber-cyan font-semibold">2-Factor Face Recognition & Official Mobile OTP 2FA</strong>, 
            instant age validation, constituency data isolation, and live <strong className="text-cyber-emerald font-semibold">PowerBI Executive Seat Analytics</strong> for all 234 assembly seats.
          </p>

          {/* Role Separation Dual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto mb-14">
            
            {/* Card 1: Citizen Gateway Card */}
            <Link
              to="/voter"
              className="group relative p-8 rounded-3xl glass-panel border border-cyber-cyan/30 hover:border-cyber-cyan transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between overflow-hidden shadow-2xl shadow-cyan-950/40"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-cyber-cyan/10 rounded-full blur-3xl group-hover:bg-cyber-cyan/25 transition-all duration-500" />
              
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3.5 rounded-2xl bg-cyan-950/80 border border-cyber-cyan/40 text-cyber-cyan shadow-lg shadow-cyber-cyan/20 group-hover:rotate-6 transition-transform">
                    <Vote className="w-8 h-8" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyber-cyan/40 text-cyber-cyan text-xs font-mono font-bold tracking-wider uppercase">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>Citizen Portal</span>
                  </div>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 group-hover:text-cyber-cyan transition-colors">
                  Voter Verification Booth
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Verify identity through <strong>Live Face Recognition</strong> and receive an <strong>Official SMS OTP</strong> to authorize your voting access. 
                  View your authorized constituency ballot, cast your vote, and receive an instant tamper-proof receipt.
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyber-cyan flex-shrink-0" />
                    <span>Strict 1-Citizen 1-Vote fraud protection</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyber-cyan flex-shrink-0" />
                    <span>Confidential voting data isolation</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyber-cyan flex-shrink-0" />
                    <span>Emergency Helpdesk support integration</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-sm font-semibold text-cyber-cyan group-hover:translate-x-1 transition-transform flex items-center gap-2">
                  <span>Enter Biometric Booth</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
                <span className="text-xs font-mono text-slate-400">ID: TN-VOTER-2026</span>
              </div>
            </Link>

            {/* Card 2: Admin Command Center Card */}
            <Link
              to="/admin/login"
              className="group relative p-8 rounded-3xl glass-panel border border-cyber-emerald/30 hover:border-cyber-emerald transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between overflow-hidden shadow-2xl shadow-emerald-950/40"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-cyber-emerald/10 rounded-full blur-3xl group-hover:bg-cyber-emerald/25 transition-all duration-500" />
              
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-cyber-emerald/40 text-cyber-emerald shadow-lg shadow-cyber-emerald/20 group-hover:rotate-45 transition-transform duration-500">
                    <Settings className="w-8 h-8" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-cyber-emerald/40 text-cyber-emerald text-xs font-mono font-bold tracking-wider uppercase">
                    <Lock className="w-3 h-3" />
                    <span>Officer Portal</span>
                  </div>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 group-hover:text-cyber-emerald transition-colors">
                  Admin Command Workspace
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Official Election Commission hub to enroll citizen biometrics, manage candidates across 234 assembly seats, 
                  enforce polling hours (7 AM - 6 PM), and access PowerBI executive analytics.
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyber-emerald flex-shrink-0" />
                    <span>Live webcam face & mobile OTP 2FA enrollment</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyber-emerald flex-shrink-0" />
                    <span>Age &lt; 18 eligibility auto-lockout</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyber-emerald flex-shrink-0" />
                    <span>Excel candidate import & seat leaderboard</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-sm font-semibold text-cyber-emerald group-hover:translate-x-1 transition-transform flex items-center gap-2">
                  <span>Authorize Official Access</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
                <span className="text-xs font-mono text-slate-400">SEC-GOV-AUTH</span>
              </div>
            </Link>

          </div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl glass-card border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">234</div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Assembly Seats</div>
              <div className="text-[10px] text-cyber-cyan font-mono mt-0.5">Tamil Nadu State</div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyber-emerald font-mono">2-Factor</div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Biometric Defense</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Face Biometrics + Phone OTP</div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">0.00%</div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Duplicate Votes</div>
              <div className="text-[10px] text-cyber-cyan font-mono mt-0.5">Hardware Ledger Lock</div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">PowerBI</div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Executive Analytics</div>
              <div className="text-[10px] text-amber-300 font-mono mt-0.5">Seat Winner Leaderboard</div>
            </div>
          </div>

        </section>

        {/* COMPREHENSIVE ARCHITECTURE & FEATURE GRID */}
        <section className="py-16 border-t border-white/10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyber-cyan px-3 py-1 rounded-full bg-cyan-950/60 border border-cyber-cyan/30">
              Technical Modules & Fraud Prevention
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
              Built for Absolute Election Integrity
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3">
              Every stage of the voting lifecycle is protected with cryptographic validation and automated biometric checks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1: Face Mesh */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 hover:border-cyber-cyan/50 transition-all group">
              <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyber-cyan/30 text-cyber-cyan w-fit mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Live Cyber-Bracket Face Recognition</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Real-time webcam video stream with high-contrast square bounding box targeting. Automatically captures face geometry snapshot during registration and verifies voter in booth.
              </p>
              <div className="text-[11px] font-mono text-cyber-cyan bg-cyan-950/60 px-2.5 py-1 rounded border border-cyber-cyan/20 inline-block">
                WebRTC • Canvas Frame Grab
              </div>
            </div>

            {/* Feature 2: Official Phone OTP 2FA */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 hover:border-cyber-emerald/50 transition-all group">
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-cyber-emerald/30 text-cyber-emerald w-fit mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Official Mobile Phone OTP 2FA Engine</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Strict two-factor authentication sending state-verified SMS OTPs to the citizen's registered 10-digit mobile number during both voter registration and polling booth ballot unlock.
              </p>
              <div className="text-[11px] font-mono text-cyber-emerald bg-emerald-950/60 px-2.5 py-1 rounded border border-cyber-emerald/20 inline-block">
                TN-SEC 2FA SMS Gateway
              </div>
            </div>

            {/* Feature 3: Age < 18 Verification Rule */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 hover:border-amber-400/50 transition-all group">
              <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-400/30 text-amber-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Age &lt; 18 Eligibility Verification</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Live date of birth calculation. If an applicant's age is below 18, the system immediately presents an alert: <em>"You are not eligible for election"</em> and permanently disables submission.
              </p>
              <div className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-400/20 inline-block">
                Instant DOB Validation Rule
              </div>
            </div>

            {/* Feature 4: Time Lockout (7 AM - 6 PM) */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 hover:border-red-400/50 transition-all group">
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-400/30 text-red-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Time-Locked Polling Hours</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Strict administrative configuration for election polling hours (e.g., 07:00 AM to 06:00 PM). As soon as time crosses 6:00 PM, all voter booths automatically lock down.
              </p>
              <div className="text-[11px] font-mono text-red-300 bg-red-950/60 px-2.5 py-1 rounded border border-red-400/20 inline-block">
                Server-Side Timestamp Lock
              </div>
            </div>

            {/* Feature 5: Emergency Helpdesk Mailer */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 hover:border-cyber-cyan/50 transition-all group">
              <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyber-cyan/30 text-cyber-cyan w-fit mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant "Help Me" Support Dispatch</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Voters facing issues can click "Help Me" at any time. Submitted tickets, descriptions, and contact info are automatically dispatched via email directly to <code className="text-cyber-cyan font-mono">parthasarathi3046@gmail.com</code>.
              </p>
              <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-400/20 inline-block">
                SMTP / Nodemailer Integration
              </div>
            </div>

            {/* Feature 6: PowerBI Style Executive Analytics */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 hover:border-emerald-400/50 transition-all group">
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-400/30 text-emerald-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">PowerBI Executive Intelligence</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Comprehensive constituency and district drilldowns. Automatically calculates the Grand Winner party with the highest seats won, and renders a descending leaderboard of all parties.
              </p>
              <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-400/20 inline-block">
                First-Past-The-Post Leaderboard
              </div>
            </div>

          </div>
        </section>

        {/* STEP-BY-STEP WORKFLOW SHOWCASE */}
        <section className="py-16 border-t border-white/10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyber-emerald px-3 py-1 rounded-full bg-emerald-950/60 border border-cyber-emerald/30">
              End-To-End Journey
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-3">
              How the Platform Operates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl glass-card border border-white/10 relative">
              <div className="text-xs font-mono text-cyber-cyan font-bold mb-2">STEP 01</div>
              <h4 className="text-base font-bold text-white mb-1.5">Biometric Enrollment</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Election officer records citizen webcam face, official mobile phone OTP verification, Aadhaar, DOB (&ge;18 verified), and registers them under their respective district & constituency.
              </p>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-white/10 relative">
              <div className="text-xs font-mono text-cyber-cyan font-bold mb-2">STEP 02</div>
              <h4 className="text-base font-bold text-white mb-1.5">Candidate Import</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Import <code className="text-cyber-cyan">candidate.xlsx</code> containing candidates for all 234 thoguthi (DMK, AIADMK, BJP, NTK, TVK, INC) or add candidates manually via "+".
              </p>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-white/10 relative">
              <div className="text-xs font-mono text-cyber-cyan font-bold mb-2">STEP 03</div>
              <h4 className="text-base font-bold text-white mb-1.5">Booth Authentication</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Voter enters booth. Webcam verifies face geometry, system sends official voting OTP to registered mobile. System displays ONLY that voter's private profile and constituency ballot.
              </p>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-white/10 relative">
              <div className="text-xs font-mono text-cyber-cyan font-bold mb-2">STEP 04</div>
              <h4 className="text-base font-bold text-white mb-1.5">Single Vote Lock</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vote is permanently cast. Receipt issued. Voter is locked from voting again in this election. Results update instantly in the PowerBI Analytics portal.
              </p>
            </div>

          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="mt-8 p-8 sm:p-12 rounded-3xl glass-panel border border-cyber-cyan/30 text-center relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyber-cyan/15 rounded-full blur-3xl" />
          <div className="absolute -left-10 -top-10 w-64 h-64 bg-cyber-emerald/15 rounded-full blur-3xl" />
          
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Experience the Future of Democratic Voting?
          </h3>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8">
            Experience 100% verified voting with cutting-edge biometrics and instant election intelligence.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/voter"
              className="cyber-btn-cyan px-7 py-3 text-sm font-bold shadow-xl shadow-cyber-cyan/25"
            >
              <Vote className="w-4 h-4" />
              <span>Launch Voter Verification Booth</span>
            </Link>

            <Link
              to="/admin/login"
              className="cyber-btn-glass px-7 py-3 text-sm font-semibold"
            >
              <Settings className="w-4 h-4" />
              <span>Access Admin Dashboard</span>
            </Link>
          </div>
        </section>

        {/* FUTURISTIC FOOTER */}
        <footer className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyber-cyan" />
            <span>Tamil Nadu State Election Commission • Cyber-Elect 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Support: <a href="mailto:parthasarathi3046@gmail.com" className="text-cyber-cyan hover:underline">parthasarathi3046@gmail.com</a></span>
            <span>•</span>
            <span className="text-cyber-emerald">System Healthy & Online</span>
          </div>
        </footer>

      </div>

    </div>
  );
}
