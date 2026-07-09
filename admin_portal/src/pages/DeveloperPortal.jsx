import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Settings as SettingsIcon,
  LogOut,
  Lock,
  Mail,
  User,
  Shield,
  Activity,
  UserCheck,
  Search,
  Plus,
  Play,
  Pause,
  AlertCircle,
  Copy,
  Check,
  Eye,
  Info,
  DollarSign,
  IndianRupee,
  Save,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const DeveloperPortal = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('theclassmate_role') === 'developer' && !!localStorage.getItem('theclassmate_token')
  );
  
  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Portal State
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, centers, settings, database
  const [stats, setStats] = useState(null);
  const [centers, setCenters] = useState([]);
  const [dbOpLoading, setDbOpLoading] = useState(false);
  const [dbOpMsg, setDbOpMsg] = useState(null);
  const [seededInfo, setSeededInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [loadingCenterDetail, setLoadingCenterDetail] = useState(false);
  const [centerDetail, setCenterDetail] = useState(null);

  // Create Center State
  const [newCenterName, setNewCenterName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLogo, setNewLogo] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [regStep, setRegStep] = useState(1);
  const [creatingCenter, setCreatingCenter] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [createError, setCreateError] = useState('');

  // Global Settings State
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    upi_id: '',
    payee_name: '',
    gst: '',
    report_footer: ''
  });
  const [settingsSaveMsg, setSettingsSaveMsg] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Copied text helper state
  const [copiedText, setCopiedText] = useState('');

  // Refresh active tab data
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'analytics') {
      fetchPlatformStats();
    } else if (activeTab === 'centers') {
      fetchCenters();
    } else if (activeTab === 'settings') {
      fetchGlobalSettings();
    }
  }, [isAuthenticated, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await api.post('/auth/developer/login/', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('theclassmate_token', token);
      localStorage.setItem('theclassmate_user', JSON.stringify(user));
      localStorage.setItem('theclassmate_role', 'developer');
      setIsAuthenticated(true);
      setActiveTab('analytics');
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Invalid developer credentials');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('theclassmate_token');
    localStorage.removeItem('theclassmate_user');
    localStorage.removeItem('theclassmate_role');
    setIsAuthenticated(false);
    setStats(null);
    setCenters([]);
    setCenterDetail(null);
    setSelectedCenter(null);
  };

  const fetchPlatformStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/developer/platform-stats/');
      setStats(res.data);
      if (res.data?.centers) {
        setCenters(res.data.centers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    setLoading(true);
    try {
      const res = await api.get('/developer/centers/');
      setCenters(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await api.get('/settings/');
      setGlobalSettings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSaveMsg('');
    try {
      await api.post('/settings/', globalSettings);
      setSettingsSaveMsg('Global settings updated successfully.');
    } catch (err) {
      setSettingsSaveMsg('Failed to update platform settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleCenter = async (centerId) => {
    try {
      await api.post(`/developer/centers/${centerId}/toggle/`);
      if (activeTab === 'analytics') {
        fetchPlatformStats();
      } else {
        fetchCenters();
      }
      if (selectedCenter === centerId) {
        fetchCenterDetails(centerId);
      }
    } catch (err) {
      alert('Failed to change center status.');
    }
  };

  const fetchCenterDetails = async (centerId) => {
    setLoadingCenterDetail(true);
    setSelectedCenter(centerId);
    setCenterDetail(null);
    try {
      const res = await api.get(`/developer/centers/${centerId}/detail/`);
      setCenterDetail(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCenterDetail(false);
    }
  };

  const handleRegisterCenter = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreatingCenter(true);
    setCreatedCredentials(null);
    try {
      const res = await api.post('/developer/centers/', {
        name: newCenterName,
        owner_name: newOwnerName,
        address: newAddress,
        city: newCity,
        state: newState,
        pincode: newPincode,
        mobile: newMobile,
        email: newEmail,
        logo: newLogo,
        website: newWebsite
      });
      setCreatedCredentials(res.data);
      setNewCenterName('');
      setNewOwnerName('');
      setNewAddress('');
      setNewCity('');
      setNewState('');
      setNewPincode('');
      setNewMobile('');
      setNewEmail('');
      setNewLogo('');
      setNewWebsite('');
      setRegStep(1);
      if (activeTab === 'centers') fetchCenters();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create center');
    } finally {
      setCreatingCenter(false);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleClearDatabase = async () => {
    if (!window.confirm("Are you sure you want to completely reset and clear the database?")) return;
    setDbOpLoading(true);
    setDbOpMsg(null);
    setSeededInfo(null);
    try {
      const res = await api.post('/developer/db/clear/');
      setDbOpMsg({ type: 'success', text: res.data.message });
    } catch (err) {
      setDbOpMsg({ type: 'error', text: err.response?.data?.error || 'Reset failed.' });
    } finally {
      setDbOpLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setDbOpLoading(true);
    setDbOpMsg(null);
    setSeededInfo(null);
    try {
      const res = await api.post('/developer/db/seed/');
      setDbOpMsg({ type: 'success', text: res.data.message });
      setSeededInfo(res.data);
    } catch (err) {
      setDbOpMsg({ type: 'error', text: err.response?.data?.error || 'Seeding failed.' });
    } finally {
      setDbOpLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#14213D] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1d2d4f] w-full max-w-md p-8 rounded-2xl shadow-2xl text-black dark:text-white"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-accent mb-3">
              <Shield size={24} />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-primary dark:text-white">Developer Portal</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Authorized access only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-500 flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Developer Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 pl-10 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                  placeholder="dev@apextuition.com"
                />
                <Mail size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Secure Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 pl-10 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                  placeholder="••••••••"
                />
                <Lock size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full p-2.5 bg-accent hover:opacity-90 disabled:opacity-50 text-primary font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer mt-6"
            >
              <span>{loggingIn ? 'Authenticating...' : 'Access Portal'}</span>
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B132B] text-black dark:text-white flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#14213D] text-white flex flex-col justify-between border-r border-[#1d2d4f] z-20">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-[#1d2d4f]">
            <span className="font-bold text-sm uppercase tracking-wider text-accent flex items-center">
              <Shield size={18} className="mr-2" /> DEV ADMIN
            </span>
          </div>

          <nav className="mt-6 px-4 space-y-1">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center p-2.5 rounded-lg text-xs font-semibold transition-all hover:bg-[#1d2d4f] ${activeTab === 'analytics' ? 'bg-accent text-[#14213D]' : 'text-gray-300'}`}
            >
              <LayoutDashboard size={16} className="mr-3" />
              <span>Platform Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('centers')}
              className={`w-full flex items-center p-2.5 rounded-lg text-xs font-semibold transition-all hover:bg-[#1d2d4f] ${activeTab === 'centers' ? 'bg-accent text-[#14213D]' : 'text-gray-300'}`}
            >
              <Building2 size={16} className="mr-3" />
              <span>Coaching Centers</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center p-2.5 rounded-lg text-xs font-semibold transition-all hover:bg-[#1d2d4f] ${activeTab === 'settings' ? 'bg-accent text-[#14213D]' : 'text-gray-300'}`}
            >
              <SettingsIcon size={16} className="mr-3" />
              <span>Global Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`w-full flex items-center p-2.5 rounded-lg text-xs font-semibold transition-all hover:bg-[#1d2d4f] ${activeTab === 'database' ? 'bg-accent text-[#14213D]' : 'text-gray-300'}`}
            >
              <Activity size={16} className="mr-3" />
              <span>Database Operations</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#1d2d4f]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2.5 rounded-lg bg-[#1d2d4f] hover:bg-red-950/20 text-red-400 hover:text-red-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            <LogOut size={14} className="mr-2" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-xl font-bold">Platform Overview</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Real-time statistics across all registered coaching centers</p>
            </div>

            {/* Overview Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#14213D] border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Total Collected</span>
                  <div className="flex items-center justify-between mt-2">
                    <h3 className="text-xl font-bold">₹{stats.total_fee_collection?.toLocaleString()}</h3>
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><IndianRupee size={18} /></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#14213D] border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Total Students</span>
                  <div className="flex items-center justify-between mt-2">
                    <h3 className="text-xl font-bold">{stats.total_students_count}</h3>
                    <div className="p-2 bg-accent/10 text-accent rounded-lg"><UserCheck size={18} /></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#14213D] border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Active Centers</span>
                  <div className="flex items-center justify-between mt-2">
                    <h3 className="text-xl font-bold">{stats.active_centers_count}</h3>
                    <div className="p-2 bg-sky-500/10 text-sky-500 rounded-lg"><Building2 size={18} /></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#14213D] border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Paused Centers</span>
                  <div className="flex items-center justify-between mt-2">
                    <h3 className="text-xl font-bold">{stats.paused_centers_count}</h3>
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Pause size={18} /></div>
                  </div>
                </div>
              </div>
            )}

            {/* Centers Table */}
            <div className="bg-white dark:bg-[#14213D] border border-gray-150 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-150 dark:border-gray-850 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Registered Coaching Centers</h3>
                <button
                  onClick={() => setActiveTab('centers')}
                  className="px-3 py-1.5 bg-accent hover:opacity-90 text-primary font-bold text-[10px] uppercase rounded flex items-center space-x-1 cursor-pointer font-sans"
                >
                  <Plus size={12} />
                  <span>Register Center</span>
                </button>
              </div>

              {loading && (
                <div className="p-8 text-center text-xs font-semibold text-gray-400 animate-pulse">
                  Querying tenant database stats...
                </div>
              )}

              {!loading && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-850 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-150 dark:border-gray-800">
                        <th className="px-6 py-3">Center Name</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Students</th>
                        <th className="px-6 py-3">Total Collected</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-xs">
                      {centers.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                          <td className="px-6 py-4 font-bold">{c.name}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{c.students_count ?? 0} students</td>
                          <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">₹{(c.total_collected ?? 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleToggleCenter(c.id)}
                              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${c.status === 'active' ? 'text-amber-500' : 'text-emerald-500'}`}
                              title={c.status === 'active' ? 'Pause Center' : 'Unpause Center'}
                            >
                              {c.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <button
                              onClick={() => fetchCenterDetails(c.id)}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-850 hover:bg-gray-200 dark:hover:bg-gray-800 rounded font-bold text-[10px] uppercase flex items-center space-x-1 cursor-pointer font-sans"
                            >
                              <Eye size={12} />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Center Detail Drawer/Modal */}
            <AnimatePresence>
              {selectedCenter && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setSelectedCenter(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className="bg-white dark:bg-[#14213D] w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden border border-gray-150 dark:border-gray-800 text-left flex flex-col max-h-[85vh]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {loadingCenterDetail && (
                      <div className="p-16 text-center text-xs font-semibold text-gray-400 animate-pulse">
                        Fetching detailed workspace state...
                      </div>
                    )}

                    {centerDetail && (
                      <>
                        <div className="px-6 py-4 bg-[#14213D] border-b border-[#1d2d4f] flex items-center justify-between text-white">
                          <div>
                            <h3 className="font-bold text-sm">{centerDetail.coaching_center?.name}</h3>
                            <p className="text-[10px] text-gray-400 mt-0.5">Workspace details and logs</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${centerDetail.coaching_center?.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {centerDetail.coaching_center?.status}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Students list */}
                            <div className="bg-gray-50 dark:bg-[#0B132B] rounded-xl p-4 border border-gray-150 dark:border-gray-800">
                              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Student Roster ({centerDetail.students?.length})</h4>
                              <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                                {centerDetail.students?.length === 0 && (
                                  <p className="text-[11px] text-gray-400 text-center py-4">No students registered yet.</p>
                                )}
                                {centerDetail.students?.map((s) => (
                                  <div key={s.id} className="p-2 bg-white dark:bg-[#14213D] border border-gray-150 dark:border-gray-800 rounded-lg flex items-center justify-between">
                                    <div>
                                      <p className="font-bold">{s.name}</p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">{s.student_id} • {s.mobile}</p>
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-400">{s.admission_date}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Payments list */}
                            <div className="bg-gray-50 dark:bg-[#0B132B] rounded-xl p-4 border border-gray-150 dark:border-gray-800">
                              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Recent Payments Ledger</h4>
                              <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                                {centerDetail.payments?.length === 0 && (
                                  <p className="text-[11px] text-gray-400 text-center py-4">No payment history recorded.</p>
                                )}
                                {centerDetail.payments?.map((p) => (
                                  <div key={p.id} className="p-2 bg-white dark:bg-[#14213D] border border-gray-150 dark:border-gray-800 rounded-lg flex items-center justify-between">
                                    <div>
                                      <p className="font-bold">{p.student_name || 'N/A'}</p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">{p.receipt_id} • {p.date}</p>
                                    </div>
                                     <span className="font-bold text-emerald-500">₹{p.amount}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-150 dark:border-gray-850 flex justify-end">
                          <button
                            onClick={() => setSelectedCenter(null)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded font-bold text-xs cursor-pointer"
                          >
                            Close Details
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'centers' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h1 className="text-xl font-bold">Coaching Centers Management</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Register new multi-tenant coaching centers or view credentials</p>
            </div>
            <div className="bg-white dark:bg-[#14213D] border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <form onSubmit={handleRegisterCenter} className="space-y-4">
                {createError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-500 flex items-center space-x-2">
                    <AlertCircle size={16} />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Progress Indicators */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-150 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${regStep >= 1 ? 'bg-accent text-primary' : 'bg-gray-100 dark:bg-gray-850 text-gray-500'}`}>1</div>
                    <span className={`text-[11px] font-bold ${regStep >= 1 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Institution</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-gray-200 dark:bg-gray-800 mx-4"></div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${regStep >= 2 ? 'bg-accent text-primary' : 'bg-gray-100 dark:bg-gray-850 text-gray-500'}`}>2</div>
                    <span className={`text-[11px] font-bold ${regStep >= 2 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Owner</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-gray-200 dark:bg-gray-800 mx-4"></div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${regStep >= 3 ? 'bg-accent text-primary' : 'bg-gray-100 dark:bg-gray-850 text-gray-500'}`}>3</div>
                    <span className={`text-[11px] font-bold ${regStep >= 3 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Branding</span>
                  </div>
                </div>

                {/* Step 1: Institutional Details */}
                {regStep === 1 && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Coaching Center Name</label>
                        <input
                          type="text"
                          required
                          value={newCenterName}
                          onChange={(e) => setNewCenterName(e.target.value)}
                          placeholder="E.g., Zenith Academy"
                          className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Contact Email Address</label>
                        <input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="E.g., info@zenith.com"
                          className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Mobile Contact Number</label>
                        <input
                          type="text"
                          required
                          value={newMobile}
                          onChange={(e) => setNewMobile(e.target.value)}
                          placeholder="10-digit phone number"
                          className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Website URL (Optional)</label>
                        <input
                          type="text"
                          value={newWebsite}
                          onChange={(e) => setNewWebsite(e.target.value)}
                          placeholder="E.g., www.zenithacademy.com"
                          className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (newCenterName.trim() && newEmail.trim() && newMobile.trim()) {
                            setRegStep(2);
                          } else {
                            setCreateError('Please complete all required fields on Step 1');
                          }
                        }}
                        className="px-5 py-2.5 bg-accent text-primary hover:opacity-90 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <span>Next Step</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Owner & Location Details */}
                {regStep === 2 && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Owner Name</label>
                        <input
                          type="text"
                          required
                          value={newOwnerName}
                          onChange={(e) => setNewOwnerName(e.target.value)}
                          placeholder="Full name of owner"
                          className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Pincode</label>
                        <input
                          type="text"
                          required
                          value={newPincode}
                          onChange={(e) => setNewPincode(e.target.value)}
                          placeholder="6-digit PIN"
                          className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Full Business Address</label>
                      <input
                        type="text"
                        required
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="Street details, building number"
                        className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          placeholder="City name"
                          className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={newState}
                          onChange={(e) => setNewState(e.target.value)}
                          placeholder="State name"
                          className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (newOwnerName.trim() && newAddress.trim() && newCity.trim() && newState.trim() && newPincode.trim()) {
                            setRegStep(3);
                          } else {
                            setCreateError('Please complete all required fields on Step 2');
                          }
                        }}
                        className="px-5 py-2.5 bg-accent text-primary hover:opacity-90 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <span>Next Step</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Branding & Confirm */}
                {regStep === 3 && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Coaching Logo URL</label>
                      <input
                        type="text"
                        required
                        value={newLogo}
                        onChange={(e) => setNewLogo(e.target.value)}
                        placeholder="Link to image asset logo (or enter placeholder text)"
                        className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                      />
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-[#0B132B] rounded-xl border border-gray-150 dark:border-gray-850 space-y-2 text-xs">
                      <h4 className="font-bold text-gray-900 dark:text-white uppercase text-[10px]">Verification Summary</h4>
                      <p className="text-gray-600 dark:text-gray-400">Review center configuration prior to workspace provisioning:</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                        <div><strong className="text-gray-400">Name:</strong> <span className="text-gray-900 dark:text-white">{newCenterName}</span></div>
                        <div><strong className="text-gray-400">Owner:</strong> <span className="text-gray-900 dark:text-white">{newOwnerName}</span></div>
                        <div><strong className="text-gray-400">Email:</strong> <span className="text-gray-900 dark:text-white">{newEmail}</span></div>
                        <div><strong className="text-gray-400">Phone:</strong> <span className="text-gray-900 dark:text-white">{newMobile}</span></div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(2)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={creatingCenter}
                        className="px-5 py-2.5 bg-accent hover:opacity-90 disabled:opacity-50 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer font-sans"
                      >
                        <Plus size={16} />
                        <span>{creatingCenter ? 'Registering...' : 'Provision Coaching Workspace'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Created Credentials Modal/Box */}
            {createdCredentials && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#14213D] text-white border border-[#1d2d4f] rounded-xl p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center space-x-2 text-accent">
                  <UserCheck size={18} />
                  <h4 className="font-bold text-sm uppercase">Admin Account Provisioned</h4>
                </div>
                <p className="text-xs text-gray-300">
                  A coaching center administrator account has been auto-generated. Please share these credentials securely.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0B132B] p-4 rounded-lg border border-[#1d2d4f] text-xs">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Admin Email</span>
                    <div className="flex items-center justify-between bg-black/30 p-2 rounded border border-[#1d2d4f]">
                      <span className="font-mono">{createdCredentials.admin_credentials?.email}</span>
                      <button
                        onClick={() => handleCopy(createdCredentials.admin_credentials?.email, 'email')}
                        className="text-gray-400 hover:text-white cursor-pointer"
                      >
                        {copiedText === 'email' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Temporary Password</span>
                    <div className="flex items-center justify-between bg-black/30 p-2 rounded border border-[#1d2d4f]">
                      <span className="font-mono">{createdCredentials.admin_credentials?.password}</span>
                      <button
                        onClick={() => handleCopy(createdCredentials.admin_credentials?.password, 'password')}
                        className="text-gray-400 hover:text-white cursor-pointer"
                      >
                        {copiedText === 'password' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h1 className="text-xl font-bold">Global Platform Settings</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure global parameters, invoice remarks, and institutional settings</p>
            </div>

            {settingsLoading && (
              <div className="p-8 text-center text-xs font-semibold text-gray-400 animate-pulse">
                Fetching platform configuration...
              </div>
            )}

            {!settingsLoading && (
              <div className="bg-white dark:bg-[#14213D] border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                <form onSubmit={handleSaveSettings} className="space-y-5">
                  {settingsSaveMsg && (
                    <div className="p-3 bg-accent/15 border border-accent/30 rounded-lg text-xs text-primary dark:text-accent font-semibold text-center">
                      {settingsSaveMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Global Center Name</label>
                      <input
                        type="text"
                        required
                        value={globalSettings.name || ''}
                        onChange={(e) => setGlobalSettings({ ...globalSettings, name: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">GST Identification Number</label>
                      <input
                        type="text"
                        value={globalSettings.gst || ''}
                        onChange={(e) => setGlobalSettings({ ...globalSettings, gst: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Support Mobile</label>
                      <input
                        type="text"
                        required
                        value={globalSettings.phone || ''}
                        onChange={(e) => setGlobalSettings({ ...globalSettings, phone: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Support Email</label>
                      <input
                        type="email"
                        required
                        value={globalSettings.email || ''}
                        onChange={(e) => setGlobalSettings({ ...globalSettings, email: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">UPI Payee ID</label>
                    <input
                      type="text"
                      required
                      value={globalSettings.upi_id || ''}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, upi_id: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Legal Payee Name</label>
                    <input
                      type="text"
                      required
                      value={globalSettings.payee_name || ''}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, payee_name: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Address</label>
                    <textarea
                      required
                      value={globalSettings.address || ''}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, address: e.target.value })}
                      rows="2"
                      className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Report Remarks Footer</label>
                    <input
                      type="text"
                      value={globalSettings.report_footer || ''}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, report_footer: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-[#0B132B] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-150 dark:border-gray-850">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-5 py-2.5 bg-accent hover:opacity-90 disabled:opacity-50 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer font-sans"
                    >
                      <Save size={16} />
                      <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h1 className="text-xl font-bold">Database Administration</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Perform database seeding, schema resets, and maintenance actions.</p>
            </div>

            <div className="bg-white dark:bg-[#14213D] border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-6">
              {dbOpMsg && (
                <div className={`p-3 border rounded-lg text-xs font-semibold text-center ${dbOpMsg.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400'}`}>
                  {dbOpMsg.text}
                </div>
              )}

              {/* Seed database block */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-[#0B132B] rounded-xl border border-gray-150 dark:border-gray-800 gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-sm">Seed Mock Database</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Populates the database with Aura Academy coaching center, pre-configured batches, students (STU-1001/2/3), attendance, remarks, and billing transactions.</p>
                </div>
                <button
                  onClick={handleSeedDatabase}
                  disabled={dbOpLoading}
                  className="px-5 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  {dbOpLoading ? 'Processing...' : 'Seed Mock Data'}
                </button>
              </div>

              {/* Clear database block */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-[#0B132B] rounded-xl border border-gray-150 dark:border-gray-800 gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-red-500">Reset & Clear Database</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Warning: Deletes all batches, student profiles, attendance matrices, ledger payments, homework worksheets, and remarks. Developer account is preserved.</p>
                </div>
                <button
                  onClick={handleClearDatabase}
                  disabled={dbOpLoading}
                  className="px-5 py-2.5 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  {dbOpLoading ? 'Processing...' : 'Reset Database'}
                </button>
              </div>
            </div>

            {/* Print Provisioned Admin Credentials from Seeding */}
            {seededInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#14213D] text-white border border-[#1d2d4f] rounded-xl p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center space-x-2 text-accent">
                  <UserCheck size={18} />
                  <h4 className="font-bold text-sm uppercase">Seeded Administrative Workspace</h4>
                </div>
                <p className="text-xs text-gray-300">
                  Use the following credentials to login to the seeded coaching center:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0B132B] p-4 rounded-lg border border-[#1d2d4f] text-xs">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Admin Email</span>
                    <div className="bg-black/30 p-2 rounded border border-[#1d2d4f] font-mono">
                      admin@auraacademy.com
                    </div>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Admin Password</span>
                    <div className="bg-black/30 p-2 rounded border border-[#1d2d4f] font-mono">
                      admin123
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-300 space-y-1 pt-2">
                  <p className="font-bold text-accent">Student/Parent Mobile Access Details:</p>
                  <p>• Student Name: Pooja Sharma (ID: STU-1002, Mobile: 9876543210, Batch Code: B-MATH10)</p>
                  <p>• Student Name: Amit Kumar (ID: STU-1001, Mobile: 9999888877, Batch Code: B-MATH10)</p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DeveloperPortal;
