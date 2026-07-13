import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, KeyRound, Phone, ArrowRight, UserCheck, Bookmark, Mail, User, Lock } from 'lucide-react';
import api from '../services/api';
import emailjs from '@emailjs/browser';

// EmailJS Configuration Constants (replace with your active credentials)
const EMAILJS_SERVICE_ID = "joshi's Service"; 
const EMAILJS_TEMPLATE_ID = "template_pj07ien";  
const EMAILJS_PUBLIC_KEY = "m0gfg5m2b0i9nXxb7";        

const Auth = () => {
  const { loginSendOTP, loginVerifyOTP, completeRegistration } = useAuth();
  const navigate = useNavigate();

  // Unified flow steps:
  // 1: single-login-form
  // 3: register-profile (only if new user)
  const [step, setStep] = useState(1);
  
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [publicSettings, setPublicSettings] = useState(null);

  React.useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await api.get('/public/settings/');
        setPublicSettings(res.data);
      } catch (err) {
        console.error('Failed to load public settings:', err);
      }
    };
    fetchPublicSettings();
  }, []);

  // Step 3 (Registration) Fields
  const [studentName, setStudentName] = useState('');
  const [surname, setSurname] = useState('');
  const [parentName, setParentName] = useState('');
  const [studentContact, setStudentContact] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Countdown timer for OTP
  React.useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpDigitChange = (idx, value) => {
    if (isNaN(value)) return;
    const newDigits = [...otpDigits];
    newDigits[idx] = value.substring(value.length - 1);
    setOtpDigits(newDigits);

    // Auto-focus next field
    if (value && idx < 5) {
      const nextInput = document.getElementById(`otp-digit-${idx + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      const newDigits = [...otpDigits];
      if (!newDigits[idx] && idx > 0) {
        // Focus previous field and clear it
        const prevInput = document.getElementById(`otp-digit-${idx - 1}`);
        prevInput?.focus();
        newDigits[idx - 1] = '';
      } else {
        newDigits[idx] = '';
      }
      setOtpDigits(newDigits);
      e.preventDefault();
    }
  };

  const handleSendOTP = async (e) => {
    e?.preventDefault();
    if (!email) {
      setError('Email Address is required to request an OTP.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address (e.g. abc@gmail.com).');
      return;
    }

    setError('');
    setSuccess('');
    setOtpLoading(true);

    try {
      const res = await loginSendOTP(email, undefined);
      const targetEmail = res.email || email;
      
      // Log generated OTP to developer console for safety
      console.log(`[DEVELOPER SYSTEM] Generated login OTP code is: ${res.otp}`);

      try {
        // Explicitly initialize EmailJS
        emailjs.init(EMAILJS_PUBLIC_KEY);
        
        // Dispatch email using EmailJS with multiple key bindings
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: targetEmail,
            email: targetEmail,
            otp_code: res.otp,
            otp: res.otp,
            code: res.otp,
            message: `Your verification OTP is ${res.otp}`,
            to_name: "Parent"
          },
          EMAILJS_PUBLIC_KEY
        );

        setSuccess(`Verification OTP code generated and sent to ${targetEmail} via EmailJS!`);
      } catch (emailjsErr) {
        console.error("EmailJS dispatch failed:", emailjsErr);
        setSuccess(`OTP generated! (Email delivery failed. You can retrieve the OTP from your browser's F12 Developer Console).`);
      }

      // Start 60 second timer
      setTimer(60);
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const otpCode = otpDigits.join('');
    if (!email || otpCode.length < 6) {
      setError('Email Address and the complete 6-digit Verification OTP are required to login.');
      return;
    }

    if (timer === 0) {
      setError('Your OTP code has expired. Please request a new code.');
      return;
    }
    
    setLoading(true);

    try {
      const res = await loginVerifyOTP(email, otpCode, undefined);
      if (res.is_new_user) {
        setSuccess('OTP verified successfully! Let\'s setup your profile details.');
        setStep(3);
      } else {
        setSuccess('Authentication successful. Logging you in...');
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!studentName || !surname || !parentName || !studentContact || !parentContact || !batchCode || !password) {
      setError('Student Name, Surname, Parent Name, Student Contact, Parent Contact, Batch Code, and Password are all required.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/public/register-student/', {
        batch_code: batchCode,
        name: studentName,
        surname: surname,
        parent_name: parentName,
        student_contact: studentContact,
        parent_contact: parentContact,
        email: email,
        password: password
      });

      const { token, user } = response.data;
      completeRegistration(token, user);
      setSuccess('Profile configuration complete! Directing to portal dashboard...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#14213D] px-4 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(252,163,17,0.1),transparent_70%)] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#14213D]/90 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl p-8 relative z-10 text-white"
      >
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-xl bg-accent/10 text-accent mb-3">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">{publicSettings?.name || 'Parent & Student Portal'}</h2>
          <p className="text-[10px] text-accent font-extrabold uppercase tracking-widest mt-1">
            Powered by TheClassMate
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {step === 1 ? 'Log in to access student directories and ledgers' : 'Configure your profile details to link to your tuition batch'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-semibold text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 text-center"
          >
            {success}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="login-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleLoginSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Verification OTP Code</label>
                  {timer > 0 ? (
                    <span className="text-[10px] text-accent font-bold font-mono">Expires in {timer}s</span>
                  ) : (
                    timer === 0 && otpDigits.some(d => d) && (
                      <span className="text-[10px] text-red-500 font-bold">Expired</span>
                    )
                  )}
                </div>
                
                <div className="flex justify-center space-x-3 my-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-digit-${idx}`}
                      type="text"
                      maxLength="1"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      required
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 bg-primary/30 border-2 border-gray-800 focus:border-accent focus:bg-primary/50 text-white rounded-xl text-center text-lg font-bold outline-none transition-all shadow-inner focus:ring-4 focus:ring-accent/15 font-sans"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  disabled={otpLoading || timer > 0}
                  onClick={handleSendOTP}
                  className="w-full mt-2 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent font-bold text-[10px] rounded-lg transition-all flex items-center justify-center border border-accent/20 disabled:opacity-50 cursor-pointer"
                >
                  {otpLoading ? 'Sending...' : timer > 0 ? `Resend available in ${timer}s` : 'Request OTP / Resend Code'}
                </button>
              </div>

              {timer > 0 && (
                <div className="flex items-center justify-center space-x-2 py-2.5 bg-accent/5 rounded-xl border border-accent/10 animate-pulse">
                  <span className="text-[11px] text-accent font-bold">
                    ⏰ Verification code is active. Expires in {timer} seconds.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || timer === 0 || otpDigits.some(d => !d)}
                className="w-full mt-2 py-2.5 bg-accent hover:opacity-90 text-primary font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 font-sans"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                {!loading && <ArrowRight size={14} />}
              </button>

              <div className="text-center mt-4 border-t border-gray-800/40 pt-4">
                <button
                  type="button"
                  onClick={() => { setStep(3); setError(''); setSuccess(''); }}
                  className="text-xs text-accent hover:underline font-bold"
                >
                  Don't have an account? Sign Up
                </button>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form
              key="register-profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-[11px] text-accent flex items-center space-x-2">
                <UserCheck size={16} />
                <span>Join your coaching batch. Enter your profile details below.</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Student First Name *</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="E.g., Jane"
                    className="w-full px-2.5 py-1.5 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Student Surname *</label>
                  <input
                    type="text"
                    required
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="E.g., Doe"
                    className="w-full px-2.5 py-1.5 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Parent First Name *</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="E.g., Robert"
                    className="w-full px-2.5 py-1.5 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Batch Invite Code *</label>
                  <input
                    type="text"
                    required
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    placeholder="E.g., B-MATH10"
                    className="w-full px-2.5 py-1.5 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Student Contact *</label>
                  <input
                    type="text"
                    required
                    value={studentContact}
                    onChange={(e) => setStudentContact(e.target.value)}
                    placeholder="Student Mobile"
                    className="w-full px-2.5 py-1.5 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Parent Contact *</label>
                  <input
                    type="text"
                    required
                    value={parentContact}
                    onChange={(e) => setParentContact(e.target.value)}
                    placeholder="Parent Mobile"
                    className="w-full px-2.5 py-1.5 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Parent Portal Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent.name@example.com"
                  className="w-full px-2.5 py-1.5 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Account Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create Portal Password"
                  className="w-full px-2.5 py-1.5 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-accent hover:opacity-90 text-primary font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 font-sans"
              >
                <span>{loading ? 'Completing Setup...' : 'Register Profile & Log In'}</span>
                {!loading && <ArrowRight size={14} />}
              </button>

              <div className="text-center mt-4 border-t border-gray-800/40 pt-4">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                  className="text-xs text-accent hover:underline font-bold"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Auth;
