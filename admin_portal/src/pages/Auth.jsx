import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Layers, ArrowRight, ArrowLeft, Smartphone, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const Auth = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forced Password Change states
  const [mustReset, setMustReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot Password states
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: request, 2: verify, 3: reset
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpMobile, setOtpMobile] = useState('');

  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, label: 'None', color: 'bg-gray-700', textClass: 'text-gray-400' };
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', textClass: 'text-red-400' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-amber-500', textClass: 'text-amber-400' };
    return { score, label: 'Strong', color: 'bg-emerald-500', textClass: 'text-emerald-400' };
  };

  const strength = checkPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res.must_change_password) {
          setMustReset(true);
        } else {
          navigate('/');
        }
      } else {
        await register(firstName, lastName, email, password);
        setSuccess('Admin registration completed successfully! Please sign in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const strengthCheck = checkPasswordStrength(newPassword);
    if (strengthCheck.label !== 'Strong') {
      setError('Your new password must satisfy all complexity constraints (Strong rating).');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password/', { new_password: newPassword });
      setSuccess('Your password has been initialized. Redirecting you to the dashboard...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password handlers
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/send-otp/', { email_or_phone: forgotIdentifier });
      setOtpMobile(res.data.mobile);
      setSuccess(res.data.message);
      setForgotStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not verify user identifier.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/verify-otp/', { mobile: otpMobile, otp_code: otpCode });
      setSuccess('OTP verification successful. Please enter your new password.');
      setForgotStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const strengthCheck = checkPasswordStrength(newPassword);
    if (strengthCheck.label !== 'Strong') {
      setError('Your new password must satisfy all complexity constraints (Strong rating).');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password/reset/', {
        mobile: otpMobile,
        otp_code: otpCode,
        new_password: newPassword
      });
      setSuccess('Password reset completed successfully. Returning to sign in...');
      setTimeout(() => {
        setForgotMode(false);
        setForgotStep(1);
        setForgotIdentifier('');
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#14213D] px-4 relative overflow-hidden">
      {/* Dynamic decorative backdrop grids */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(252,163,17,0.1),transparent_70%)] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#14213D]/90 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-accent/10 text-accent mb-3">
            <Layers size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-sans">TheClassMate</h2>
          <p className="text-xs text-gray-400 mt-1">
            {mustReset
              ? 'Initialize Secure Password'
              : forgotMode
              ? 'Multi-factor Account Recovery'
              : isLogin
              ? 'Sign in to access your admin dashboard'
              : 'Create an administrative workspace account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-semibold text-red-400 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 text-center">
            {success}
          </div>
        )}

        {/* FORCED RESET ON FIRST-TIME LOGIN */}
        {mustReset && (
          <form onSubmit={handleForceResetSubmit} className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 flex items-start space-x-2">
              <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
              <p>Please update your temporary password to comply with security requirements.</p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">New Password (12+ Characters)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 12 characters"
                  className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none font-mono"
                />
              </div>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400">Strength:</span>
                  <span className={`font-bold ${strength.textClass}`}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${(strength.score / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[8px] text-gray-500">
                  Password must include uppercase, lowercase, numbers, and special symbols.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype password"
                  className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent/90 text-primary font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Updating Credentials...' : 'Save Password'}</span>
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD WORKFLOW */}
        {forgotMode && !mustReset && (
          <div>
            {forgotStep === 1 && (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Registered Email or Mobile</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <Mail size={14} />
                    </span>
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="contact@coaching.com or mobile"
                      className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-accent hover:bg-accent/90 text-primary font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Sending Verification...' : 'Request Verification OTP'}</span>
                  {!loading && <ArrowRight size={14} />}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotVerify} className="space-y-4">
                <div className="text-center text-xs text-gray-300 mb-2">
                  An OTP verification code was sent to your phone ending in{' '}
                  <span className="font-mono text-accent">{otpMobile?.slice(-4)}</span>.
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Enter 6-Digit OTP</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <Smartphone size={14} />
                    </span>
                    <input
                      type="text"
                      maxLength="6"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none tracking-widest text-center font-bold font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-accent hover:bg-accent/90 text-primary font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Verifying OTP...' : 'Verify OTP'}</span>
                  {!loading && <ArrowRight size={14} />}
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleForgotReset} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Enter Strong Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 12 characters"
                      className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none font-mono"
                    />
                  </div>
                </div>

                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-400">Strength:</span>
                      <span className={`font-bold ${strength.textClass}`}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${(strength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retype password"
                      className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-accent hover:bg-accent/90 text-primary font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Resetting Password...' : 'Save Password'}</span>
                  {!loading && <ArrowRight size={14} />}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setForgotStep(1);
                  setForgotIdentifier('');
                  setOtpCode('');
                  setError('');
                  setSuccess('');
                }}
                className="text-xs text-accent hover:underline cursor-pointer flex items-center justify-center mx-auto space-x-1"
              >
                <ArrowLeft size={12} />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* REGULAR SIGN IN / ADMIN REGISTER */}
        {!mustReset && !forgotMode && (
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">First Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                        <User size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jane"
                        className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Last Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                        <User size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Email / Student ID</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Mail size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@theclassmate.in"
                    className="w-full pl-9 pr-3 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(true);
                        setForgotStep(1);
                        setError('');
                        setSuccess('');
                      }}
                      className="text-[9px] font-bold text-accent hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-primary/40 border border-gray-800 text-white rounded-lg text-xs focus:border-accent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-accent hover:bg-accent/90 text-primary font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Admin Account'}</span>
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            {/* Registration toggle removed */}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
