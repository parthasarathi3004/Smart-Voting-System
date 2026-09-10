import React, { useState, useEffect } from 'react';
import { Smartphone, Send, CheckCircle2, ShieldAlert, KeyRound, RefreshCw, MessageSquare, Check, Settings } from 'lucide-react';
import { api } from '../services/api';

export default function PhoneOtpVerification({ 
  phoneNumber: propPhone = '', 
  verifiedPhone = '',
  onPhoneChange, 
  isVerified: propVerified = false, 
  onVerifiedChange,
  onVerificationSuccess,
  voterName = ''
}) {
  const [internalPhone, setInternalPhone] = useState(propPhone || verifiedPhone || '');
  const [internalVerified, setInternalVerified] = useState(propVerified);
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // SMS Gateway Configuration Drawer State
  const [showSmsConfig, setShowSmsConfig] = useState(false);
  const [fast2smsKey, setFast2smsKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveSuccess, setKeySaveSuccess] = useState('');
  const [smsDeliveryStatus, setSmsDeliveryStatus] = useState(null);
  const [gatewayConfigured, setGatewayConfigured] = useState(false);
  const [devFallbackCode, setDevFallbackCode] = useState('');
  const [showFallbackCode, setShowFallbackCode] = useState(false);

  // Check if SMS gateway is configured on mount
  useEffect(() => {
    api.getSmsConfig().then(res => {
      if (res && res.hasApiKey) {
        setGatewayConfigured(true);
      }
    }).catch(() => {});
  }, []);

  // Sync with incoming props if provided
  useEffect(() => {
    if (propPhone) setInternalPhone(propPhone);
    else if (verifiedPhone) setInternalPhone(verifiedPhone);
  }, [propPhone, verifiedPhone]);

  useEffect(() => {
    setInternalVerified(propVerified);
  }, [propVerified]);

  // Cooldown timer for resending OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const activePhone = propPhone || verifiedPhone || internalPhone;
  const cleanPhone = String(activePhone || '').replace(/\D/g, '').slice(-10);
  const isCurrentlyVerified = Boolean(propVerified || internalVerified);

  const handlePhoneInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setInternalPhone(raw);
    if (onPhoneChange) onPhoneChange(raw);
    if (isCurrentlyVerified) {
      setInternalVerified(false);
      if (onVerifiedChange) onVerifiedChange(false);
    }
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage('Invalid mobile number! In India, valid SIM numbers must be 10 digits starting with 6, 7, 8, or 9.');
      return;
    }

    setIsSendingOtp(true);
    setErrorMessage('');
    setSuccessMessage('');
    setSmsDeliveryStatus(null);

    try {
      const res = await api.sendVoterOtp(cleanPhone, 'REGISTRATION');
      if (res.success) {
        setOtpSent(true);
        setCountdown(45);
        setSmsDeliveryStatus(res.smsStatus);
        if (res.devFallbackCode) {
          setDevFallbackCode(res.devFallbackCode);
        }

        if (res.smsStatus?.delivered) {
          setSuccessMessage(`✅ Real SMS delivered to +91 ${cleanPhone}! Check the Messages app on your phone.`);
          setShowSmsConfig(false);
          setDevFallbackCode('');
        } else if (res.smsStatus?.needsApiKey) {
          setShowSmsConfig(true);
          setErrorMessage('⚠️ Real SMS Gateway Key Required: To receive SMS on your physical mobile phone, please enter your Fast2SMS API Key below!');
        } else if (res.smsStatus?.error) {
          setShowSmsConfig(true);
          setErrorMessage(res.smsStatus.error);
        } else {
          setSuccessMessage(`📲 OTP dispatched to +91 ${cleanPhone}.`);
        }
      } else {
        setErrorMessage(res.message || 'Failed to dispatch OTP.');
      }
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Invalid mobile number or network error.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Save API Key and immediately re-send real SMS
  const handleSaveApiKeyAndResend = async () => {
    if (!fast2smsKey.trim()) {
      setErrorMessage('Please paste your Fast2SMS API Key.');
      return;
    }

    setIsSavingKey(true);
    setKeySaveSuccess('');
    setErrorMessage('');

    try {
      const res = await api.updateSmsConfig({ fast2smsApiKey: fast2smsKey.trim() });
      if (res.success) {
        setGatewayConfigured(true);
        setKeySaveSuccess('API Key saved successfully! Sending SMS to your mobile phone...');
        
        // Immediately dispatch real SMS to the phone!
        const otpRes = await api.sendVoterOtp(cleanPhone, 'REGISTRATION');
        if (otpRes.success) {
          setOtpSent(true);
          setCountdown(45);
          setSmsDeliveryStatus(otpRes.smsStatus);
          if (otpRes.devFallbackCode) {
            setDevFallbackCode(otpRes.devFallbackCode);
          }

          if (otpRes.smsStatus?.delivered) {
            setSuccessMessage(`✅ Real SMS successfully sent to +91 ${cleanPhone}! Please check your phone Messages inbox.`);
            setShowSmsConfig(false);
            setDevFallbackCode('');
          } else if (otpRes.smsStatus?.error) {
            setErrorMessage(otpRes.smsStatus.error);
          }
        }
      } else {
        setErrorMessage(res.message || 'Failed to save SMS API Key.');
      }
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Error saving SMS API Key.');
    } finally {
      setIsSavingKey(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage('');

    try {
      const res = await api.verifyVoterOtp(cleanPhone, otp.trim(), 'REGISTRATION');
      if (res.success && res.verified) {
        setInternalVerified(true);
        if (onVerifiedChange) onVerifiedChange(true);
        if (onVerificationSuccess) onVerificationSuccess(cleanPhone);
        setSuccessMessage('Mobile number +91 ' + cleanPhone + ' verified successfully! (Valid OTP ✓)');
        setErrorMessage('');
      } else {
        setErrorMessage(res.message || 'Invalid OTP! Please enter the correct code.');
      }
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Invalid OTP. Please check the code sent to your phone.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPhone = () => {
    setInternalVerified(false);
    if (onVerifiedChange) onVerifiedChange(false);
    setOtpSent(false);
    setOtp('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const isButtonEnabled = cleanPhone.length === 10 && !isSendingOtp && countdown === 0;

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-navy-950/80 border border-white/10 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyber-cyan/30 text-cyber-cyan">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Mobile Number & OTP Verification
            </h4>
            <p className="text-[11px] text-slate-400">
              Mandatory 2FA authentication for voter registration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSmsConfig(prev => !prev)}
            className="px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-navy-800 border border-white/10 text-slate-300 hover:text-cyber-cyan text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure Fast2SMS API Key for real mobile messages"
          >
            <Settings className="w-3 h-3 text-cyber-cyan" />
            <span>Gateway {gatewayConfigured ? '🟢' : '⚙️'}</span>
          </button>

          {isCurrentlyVerified ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-cyber-emerald text-cyber-emerald text-[11px] font-mono font-bold flex items-center gap-1 shadow">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PHONE VERIFIED ✓</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
              OTP PENDING
            </span>
          )}
        </div>
      </div>

      {/* Real SMS Gateway (Fast2SMS) Configuration Drawer */}
      {showSmsConfig && !isCurrentlyVerified && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-navy-900 to-cyan-950/90 border-2 border-cyber-cyan/50 space-y-3 animate-in fade-in shadow-xl text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyber-cyan">
              <KeyRound className="w-4 h-4 text-cyber-cyan" />
              <span>REAL SMS DELIVERY GATEWAY (Fast2SMS)</span>
            </div>
            <a
              href="https://www.fast2sms.com"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono text-cyan-400 hover:underline"
            >
              Sign up at fast2sms.com (Free) →
            </a>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            To receive the OTP directly in <strong className="text-white">+91 {cleanPhone || 'mobile'}</strong>'s SMS Messages app, paste your Fast2SMS API Key below:
          </p>

          <div className="flex gap-2">
            <input
              type="password"
              value={fast2smsKey}
              onChange={(e) => setFast2smsKey(e.target.value)}
              placeholder="Paste Fast2SMS API Key here..."
              className="flex-1 px-3 py-2 rounded-lg bg-navy-950 border border-white/20 text-xs font-mono text-white outline-none focus:border-cyber-cyan"
            />
            <button
              type="button"
              onClick={handleSaveApiKeyAndResend}
              disabled={!fast2smsKey.trim() || isSavingKey}
              className="px-4 py-2 rounded-lg cyber-btn-cyan text-xs font-mono font-bold whitespace-nowrap disabled:opacity-50 cursor-pointer"
            >
              {isSavingKey ? 'Saving...' : 'Save & Send Real SMS'}
            </button>
          </div>

          {keySaveSuccess && (
            <p className="text-xs font-mono text-cyber-emerald flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{keySaveSuccess}</span>
            </p>
          )}

          <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 font-sans">
            📌 <strong>Easy 3-step setup:</strong> (1) Register free at <a href="https://www.fast2sms.com" target="_blank" rel="noreferrer" className="text-cyber-cyan underline">fast2sms.com</a> with your phone. (2) Copy key from <strong>Dev API</strong>. (3) Paste here and click Save. Real SMS will instantly buzz your phone!
          </div>
        </div>
      )}

      {/* Phone Number Input Row */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
          <span>Mobile Phone Number <span className="text-cyber-crimson">*</span></span>
          <span className="text-[10px] font-mono text-slate-400">
            {cleanPhone.length}/10 digits
          </span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 select-none">
              +91
            </div>
            <input
              type="tel"
              value={activePhone}
              onChange={handlePhoneInputChange}
              disabled={isCurrentlyVerified}
              placeholder="93849 65180"
              maxLength={10}
              className={`w-full pl-12 pr-4 py-2.5 rounded-lg bg-navy-900/90 border ${
                cleanPhone.length === 10 ? 'border-cyber-cyan text-white' : 'border-white/15 text-white'
              } focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan text-sm placeholder:text-slate-500 outline-none transition-all font-mono font-bold`}
            />
          </div>

          {!isCurrentlyVerified ? (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={!isButtonEnabled}
              className={`px-4 py-2.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                isButtonEnabled 
                  ? 'cyber-btn-cyan text-black shadow-lg shadow-cyber-cyan/30 cursor-pointer scale-[1.02]' 
                  : 'bg-navy-800 text-slate-500 border border-white/10 cursor-not-allowed'
              }`}
            >
              {isSendingOtp ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Sending...</span>
                </>
              ) : countdown > 0 ? (
                <span>Resend ({countdown}s)</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResetPhone}
              className="px-3 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 text-xs font-mono border border-white/10"
            >
              Change
            </button>
          )}
        </div>
      </div>

      {/* Real SMS Handset Delivery Status Banner */}
      {otpSent && !isCurrentlyVerified && smsDeliveryStatus?.delivered && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-cyber-emerald/50 shadow-lg text-left animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-mono text-cyber-emerald font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-cyber-emerald" />
            <span>REAL SMS DELIVERED TO MOBILE VIA FAST2SMS</span>
          </div>
          <p className="text-xs text-emerald-100 font-sans leading-relaxed">
            The 6-digit OTP has been transmitted over cellular network to <strong className="text-white">+91 {cleanPhone}</strong>. Check your phone Messages app and enter the code below.
          </p>
        </div>
      )}

      {/* SMS Gateway Notice Banner (When API key is not yet set) */}
      {otpSent && !isCurrentlyVerified && smsDeliveryStatus?.needsApiKey && (
        <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/50 shadow-lg text-left animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-mono text-amber-300 font-bold mb-1">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>SMS GATEWAY KEY REQUIRED FOR PHONE DELIVERY</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSmsConfig(true)}
              className="text-[10px] text-cyber-cyan hover:underline font-mono"
            >
              Enter Fast2SMS Key →
            </button>
          </div>
          <p className="text-xs text-amber-100 font-sans leading-relaxed">
            Cellular networks require an SMS gateway key to beam SMS to physical SIMs. Click <strong>"Gateway ⚙️"</strong> above and enter your free Fast2SMS API key so the text message buzzes your phone!
          </p>
        </div>
      )}

      {/* OTP Verification Input Row */}
      {otpSent && !isCurrentlyVerified && (
        <div className="p-3.5 rounded-xl bg-navy-900 border border-white/10 text-left space-y-3 animate-in fade-in">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
            Enter 6-Digit Verification Code Sent to +91 {cleanPhone}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-950 border border-white/20 focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan text-sm text-white placeholder:text-slate-500 outline-none transition-all font-mono tracking-widest text-center font-bold"
              />
            </div>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || isVerifyingOtp}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-navy-800 disabled:text-slate-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950 whitespace-nowrap cursor-pointer"
            >
              {isVerifyingOtp ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify OTP</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success / Error Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-cyber-crimson/50 text-red-200 text-xs font-mono space-y-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-cyber-crimson flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>

          {errorMessage.includes('website verification') && (
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-slate-300 font-sans space-y-1">
              <p className="font-bold text-cyber-cyan">👉 Fast2SMS Verification Notice:</p>
              <p>In your Fast2SMS tab (Tab 6: <strong>OTP SMS</strong>), add your website/URL under <strong>Website Verification</strong> to approve live API sending.</p>
            </div>
          )}

          {devFallbackCode && (
            <div className="pt-2 border-t border-red-900/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Testing registration while verification is pending?</span>
              <button
                type="button"
                onClick={() => setShowFallbackCode(prev => !prev)}
                className="text-cyber-cyan hover:underline font-bold cursor-pointer"
              >
                {showFallbackCode ? 'Hide Test Code' : 'Reveal Test OTP Code →'}
              </button>
            </div>
          )}

          {showFallbackCode && devFallbackCode && (
            <div className="p-2 rounded bg-cyan-950/80 border border-cyber-cyan/40 text-center font-mono text-white text-xs">
              Generated OTP: <strong className="text-cyber-cyan text-sm tracking-widest">{devFallbackCode}</strong>
            </div>
          )}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-cyber-emerald/50 text-emerald-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyber-emerald flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

    </div>
  );
}
