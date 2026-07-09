import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import CommandPalette from '../components/CommandPalette';
import api from '../services/api';
import {
  LayoutDashboard,
  Layers,
  Users,
  CalendarDays,
  CreditCard,
  BookOpen,
  FileSpreadsheet,
  Settings,
  Trash2,
  FileCode,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  Activity,
  Terminal,
  Award,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = ({ children }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch real notifications and settings parameters
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications/');
        setNotifications(response.data);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings/');
        setSettings(response.data);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchNotifications();
    fetchSettings();
  }, []);

  // Listen for global Ctrl+K shortcut
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const bellButton = document.getElementById('bell-button');
      const avatarButton = document.getElementById('avatar-button');
      
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        if (!bellButton || !bellButton.contains(event.target)) {
          setShowNotifications(false);
        }
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        if (!avatarButton || !avatarButton.contains(event.target)) {
          setShowProfile(false);
        }
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Batches', path: '/batches', icon: Layers },
    { name: 'Teachers Directory', path: '/teachers', icon: User },
    { name: 'Students Directory', path: '/students', icon: Users },
    { name: 'Attendance Matrix', path: '/attendance', icon: CalendarDays },
    { name: 'Fees & Ledgers', path: '/fees', icon: CreditCard },
    { name: 'Homework Tasks', path: '/homework', icon: BookOpen },
    { name: 'Exams', path: '/exams', icon: FileSpreadsheet },
    { name: 'Grades', path: '/grades', icon: Award },
    { name: 'Audit Logs', path: '/audit-logs', icon: Activity },
    { name: 'Recycle Bin', path: '/recycle-bin', icon: Trash2 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0B132B] text-black dark:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2 }}
        className="fixed top-0 bottom-0 left-0 bg-[#14213D] text-white flex flex-col justify-between z-30 shadow-lg border-r border-[#1d2d4f]"
      >
        <div>
          {/* Logo / Brand Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#1d2d4f] overflow-hidden">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-sm uppercase tracking-wider text-accent flex items-center"
              >
                <Layers size={18} className="mr-2" /> {settings?.name || 'THECLASSMATE'}
              </motion.span>
            )}
            {collapsed && (
              <div className="w-full flex justify-center text-accent">
                <Layers size={22} />
              </div>
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
                  {!collapsed && (
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
        <div className="p-3 border-t border-[#1d2d4f] flex flex-col space-y-2">
          {/* Collapse trigger */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center p-2 rounded-lg bg-[#1d2d4f] hover:bg-[#283c66] text-gray-300 hover:text-white cursor-pointer"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ paddingLeft: collapsed ? 72 : 260 }}>
        
        {/* Header bar */}
        <header className="h-16 bg-white dark:bg-primary border-b border-gray-200 dark:border-gray-800 sticky top-0 flex items-center justify-between px-6 z-20 shadow-sm transition-colors">
          <h2 className="text-sm font-extrabold text-accent flex items-center tracking-wider">
            {settings?.name || 'THECLASSMATE'} <span className="mx-2 text-gray-400 dark:text-gray-600 font-normal">|</span> <span className="text-gray-800 dark:text-white font-bold">{location.pathname === '/' ? 'DASHBOARD' : location.pathname.substring(1).toUpperCase().replace('-', ' ')}</span>
          </h2>

          <div className="flex items-center space-x-4">
            
            {/* Dark Mode Theme toggle */}
            <ThemeToggle />

            {/* Alerts & Notifications Bell */}
            <div className="relative">
              <button
                id="bell-button"
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 cursor-pointer relative animate-none"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              </button>

              {/* Notifications dropdown menu */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    ref={notificationsRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#14213D] border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-3 z-50 origin-top-right"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-850">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">System Notifications</span>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => setShowNotifications(false)} className="text-[10px] text-accent hover:underline cursor-pointer">dismiss all</button>
                        <button onClick={() => setShowNotifications(false)} className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"><X size={12} /></button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-[10px] text-gray-400 text-center py-4">No new notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-lg text-left transition-colors">
                            <h4 className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{n.title}</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{n.desc}</p>
                            <span className="text-[8px] text-gray-400 dark:text-gray-550 mt-1 block">{n.timestamp}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar menu */}
            <div className="relative">
              <button
                id="avatar-button"
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                className="flex items-center space-x-2 p-1 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-850 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#E5E5E5] text-[#14213D] font-bold flex items-center justify-center text-xs">
                  {user?.first_name?.charAt(0) || <User size={16} />}
                </div>
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    ref={profileRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#14213D] border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-2 z-50 origin-top-right"
                  >
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-850 text-left">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{user?.first_name} {user?.last_name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[9px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded-full uppercase">
                        {user?.role}
                      </span>
                    </div>
                    <div className="mt-1 space-y-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogOut size={14} className="mr-2" /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* View content container */}
        <main className="p-6 flex-1 overflow-x-hidden">
          {children}
        </main>

        {/* Layout Footer */}
        <footer className="py-6 px-6 border-t border-gray-150 dark:border-gray-800 font-sans bg-white dark:bg-primary text-gray-500 dark:text-gray-400">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-accent tracking-wider uppercase">TheClassMate</span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">© 2026. All Rights Reserved.</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <a href="#about" className="hover:text-accent hover:underline transition-colors">About Us</a>
              <a href="#contact" className="hover:text-accent hover:underline transition-colors">Contact Us</a>
              <a href="#privacy" className="hover:text-accent hover:underline transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-accent hover:underline transition-colors">Terms &amp; Conditions</a>
              <a href="#help" className="hover:text-accent hover:underline transition-colors">Help Center</a>
              <a href="#support" className="hover:text-accent hover:underline transition-colors">Support</a>
            </div>
          </div>
        </footer>

        {/* Global Command Palette overlay */}
        <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
        
      </div>
    </div>
  );
};

export default MainLayout;
