import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Award,
  Clock,
  FileSpreadsheet,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../services/api';

const MainLayout = ({ children }) => {
  const { user, child, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [settings, setSettings] = useState(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings/');
        setSettings(response.data);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
        setMoreMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  }, [location.pathname]);

  const [notifications, setNotifications] = useState([]);

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications/');
        setNotifications(response.data);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    if (child) {
      fetchNotifications();
    }
  }, [child]);

  React.useEffect(() => {
    if (notifications.length > 0) {
      const readState = sessionStorage.getItem('notifications_read');
      if (readState !== 'true') {
        setHasUnreadNotifications(true);
      } else {
        setHasUnreadNotifications(false);
      }
    } else {
      setHasUnreadNotifications(false);
    }
  }, [notifications]);

  const navItems = [
    { name: 'Student Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Attendance Grid', path: '/attendance', icon: CalendarDays },
    { name: 'Homework Uploads', path: '/homework', icon: BookOpen },
    { name: 'Exam Rankings', path: '/exams', icon: Award },
    { name: 'Monthly Report Card', path: '/reports', icon: FileSpreadsheet },
    { name: 'Fees & Payments', path: '/fees', icon: CreditCard },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0B132B] text-black dark:text-white transition-colors duration-300">
      
      {/* Semi-transparent overlay on mobile */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black z-30 cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Hidden completely on mobile */}
      <motion.aside
        initial={isMobile ? { x: -260 } : {}}
        animate={
          isMobile 
            ? { x: mobileMenuOpen ? 0 : -260, width: 260 } 
            : { width: collapsed ? 72 : 260 }
        }
        transition={{ duration: 0.2 }}
        className="fixed top-0 bottom-0 left-0 bg-[#14213D] text-white flex-col justify-between z-45 shadow-lg border-r border-[#1d2d4f] hidden md:flex"
      >
        <div>
          {/* Logo / Brand Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#1d2d4f] overflow-hidden">
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-sm uppercase tracking-wider text-accent flex items-center"
              >
                <ShieldCheck size={18} className="mr-2 text-accent" /> THECLASSMATE
              </motion.span>
            )}
            {collapsed && !isMobile && (
              <div className="w-full flex justify-center text-accent">
                <ShieldCheck size={22} />
              </div>
            )}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-gray-455 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`flex items-center p-2.5 rounded-lg text-xs font-semibold transition-all group hover:bg-[#1d2d4f] ${isActive ? 'bg-accent text-[#14213D]' : 'text-gray-300 group-hover:text-white'}`}
                >
                  <item.icon size={16} className={`flex-shrink-0 ${isActive ? 'text-[#14213D]' : 'text-gray-400 group-hover:text-white'}`} />
                  {(!collapsed || isMobile) && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-3">
                      {item.name}
                    </motion.span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        {!isMobile && (
          <div className="p-3 border-t border-[#1d2d4f] flex flex-col space-y-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center justify-center p-2 rounded-lg bg-[#1d2d4f] hover:bg-[#283c66] text-gray-300 hover:text-white cursor-pointer"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        )}
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ paddingLeft: isMobile ? 0 : (collapsed ? 72 : 260) }}>
        
        {/* Header bar */}
        <header className="h-16 bg-white dark:bg-primary border-b border-gray-200 dark:border-gray-800 sticky top-0 flex items-center justify-between px-6 z-20 shadow-sm transition-colors">
          <div className="flex items-center space-x-3">
            <h2 className="text-sm font-extrabold text-accent flex items-center tracking-wider uppercase">
              {settings?.name || 'APEX COACHING ACADEMY'}
              {location.pathname !== '/' && (
                <>
                  <span className="mx-2 text-gray-400 dark:text-gray-600 font-normal">|</span>
                  <span className="text-gray-800 dark:text-white font-bold">{location.pathname.substring(1).toUpperCase().replace('-', ' ')}</span>
                </>
              )}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            
            <ThemeToggle />

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                  setHasUnreadNotifications(false);
                  sessionStorage.setItem('notifications_read', 'true');
                }}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-855 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 cursor-pointer relative"
              >
                <Bell size={18} />
                {hasUnreadNotifications && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                )}
              </button>

              {/* Notifications dropdown menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-primary border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-3 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-850 text-xs">
                    <span className="font-bold text-gray-900 dark:text-white">Announcements</span>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-accent hover:underline cursor-pointer">dismiss</button>
                  </div>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-gray-400 text-center py-4">No announcements yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-855 rounded-lg text-left transition-colors">
                          <h4 className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{n.title}</h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{n.desc}</p>
                          <span className="text-[8px] text-gray-400 dark:text-gray-550 mt-1 block">{n.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar menu */}
            <div className="relative">
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                className="flex items-center space-x-2 p-1 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-855 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#E5E5E5] text-[#14213D] font-bold flex items-center justify-center text-xs">
                  {user?.first_name?.charAt(0) || <User size={16} />}
                </div>
              </button>
            </div>

          </div>
        </header>

        {/* View content container with smooth Page Transitions */}
        <main className={`p-6 flex-1 overflow-x-hidden ${isMobile ? 'pb-24' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="w-full h-full flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        
      </div>

      {/* Detailed Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#14213D] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-gray-900 dark:text-white"
            >
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-150 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center space-x-3 pb-4 border-b border-gray-100 dark:border-gray-850">
                <div className="w-12 h-12 rounded-full bg-[#E5E5E5] text-[#14213D] font-extrabold flex items-center justify-center text-lg">
                  {user?.first_name?.charAt(0) || <User size={20} />}
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{user?.first_name} {user?.last_name || 'Parent'}</h3>
                  <p className="text-[10px] text-gray-550 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-accent text-left">Linked Student Profile</h4>
                
                {child ? (
                  <div className="space-y-2.5 bg-gray-50 dark:bg-[#1B263B] p-3.5 rounded-xl border border-gray-100 dark:border-[#2C3E60]/50 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Student Name:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{child.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Student ID:</span>
                      <span className="font-mono text-accent font-semibold">{child.student_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Batch Name:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{child.batch_name || child.batch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Parent Contact:</span>
                      <span className="text-gray-900 dark:text-white">{child.parent_contact || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Joining Date:</span>
                      <span className="text-gray-900 dark:text-white">{child.joining_date ? new Date(child.joining_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-505 dark:text-gray-450 italic text-left">No linked student data preloaded.</p>
                )}
              </div>

              <div className="mt-6 flex space-x-2.5">
                <button
                  onClick={() => { setShowProfile(false); handleLogout(); }}
                  className="flex-1 py-2 px-3 border border-red-500/20 hover:bg-red-500/10 text-red-500 font-bold rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer"
                >
                  <LogOut size={14} className="mr-2" /> Logout
                </button>
                <button
                  onClick={() => setShowProfile(false)}
                  className="flex-1 py-2 px-3 bg-accent text-[#14213D] hover:bg-accent/90 font-bold rounded-lg text-xs transition-all cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Bottom Capsule Navigation Bar */}
      {isMobile && (
        <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-[#14213D]/95 backdrop-blur-md border border-gray-800 rounded-2xl flex justify-around items-center z-40 px-2 shadow-[0_12px_30px_rgba(0,0,0,0.5)] text-white">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all cursor-pointer"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabMobile"
                    className="absolute inset-0 bg-[#FCA311]/20 rounded-2xl"
                    transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                  />
                )}
                <item.icon size={18} className={isActive ? 'text-[#FCA311] relative z-10' : 'text-gray-400 relative z-10'} />
                <span className={`text-[8px] mt-0.5 font-bold relative z-10 ${isActive ? 'text-[#FCA311]' : 'text-gray-400'}`}>
                  {item.name.replace('Student ', '').replace(' Grid', '').replace(' Uploads', '').replace(' Rankings', '')}
                </span>
              </NavLink>
            );
          })}

          <button
            onClick={() => setMoreMenuOpen(true)}
            className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all cursor-pointer"
          >
            {moreMenuOpen && (
              <div className="absolute inset-0 bg-[#FCA311]/20 rounded-2xl" />
            )}
            <Menu size={18} className={moreMenuOpen ? 'text-[#FCA311] relative z-10' : 'text-gray-400 relative z-10'} />
            <span className={`text-[8px] mt-0.5 font-bold relative z-10 ${moreMenuOpen ? 'text-[#FCA311]' : 'text-gray-400'}`}>
              More
            </span>
          </button>
        </nav>
      )}

      {/* Mobile "More" Slide-up Drawer */}
      <AnimatePresence>
        {isMobile && moreMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreMenuOpen(false)}
              className="fixed inset-0 bg-black z-45"
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 bg-[#14213D] border-t border-[#1d2d4f] rounded-t-2xl z-50 p-6 space-y-4 shadow-2xl text-white pb-8 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-[#1d2d4f]">
                <h3 className="text-xs uppercase font-extrabold text-accent tracking-wider">More Actions</h3>
                <button
                  onClick={() => setMoreMenuOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => { setMoreMenuOpen(false); navigate('/reports'); }}
                  className="flex flex-col items-center justify-center p-4 bg-[#1b263b] hover:bg-[#202d48] rounded-xl border border-[#2c3e60]/50 transition-all text-xs font-bold text-white cursor-pointer"
                >
                  <FileSpreadsheet className="text-accent mb-2" size={20} />
                  Report Card
                </button>

                <button
                  onClick={() => { setMoreMenuOpen(false); navigate('/fees'); }}
                  className="flex flex-col items-center justify-center p-4 bg-[#1b263b] hover:bg-[#202d48] rounded-xl border border-[#2c3e60]/50 transition-all text-xs font-bold text-white cursor-pointer"
                >
                  <CreditCard className="text-accent mb-2" size={20} />
                  Fees Ledger
                </button>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  onClick={() => { setMoreMenuOpen(false); setShowProfile(true); }}
                  className="flex-1 py-2.5 px-4 bg-[#1b263b] text-accent border border-accent/20 font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer"
                >
                  <User size={14} className="mr-2" /> Profile Details
                </button>
                <button
                  onClick={() => { setMoreMenuOpen(false); handleLogout(); }}
                  className="flex-1 py-2.5 px-4 bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer"
                >
                  <LogOut size={14} className="mr-2" /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MainLayout;
