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

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Simulating parent notifications
  const [notifications] = useState([
    { id: 1, title: 'Exam Grade Posted', desc: 'Kinematics Unit Test grades are now live', time: '2h ago' },
    { id: 2, title: 'Homework Assigned', desc: 'Kinematics Worksheet 1 assigned due Mon', time: '1d ago' }
  ]);

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

      {/* Sidebar */}
      <motion.aside
        initial={isMobile ? { x: -260 } : {}}
        animate={
          isMobile 
            ? { x: mobileMenuOpen ? 0 : -260, width: 260 } 
            : { width: collapsed ? 72 : 260 }
        }
        transition={{ duration: 0.2 }}
        className="fixed top-0 bottom-0 left-0 bg-[#14213D] text-white flex flex-col justify-between z-45 shadow-lg border-r border-[#1d2d4f]"
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
                <ShieldCheck size={18} className="mr-2 text-accent" /> PARENT PORTAL
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
                className="p-1 text-gray-450 hover:text-white cursor-pointer"
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
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-450 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-center mr-1"
              >
                <Menu size={20} />
              </button>
            )}
            <h2 className="text-sm font-extrabold text-accent flex items-center tracking-wider">
              THECLASSMATE <span className="mx-2 text-gray-400 dark:text-gray-600 font-normal">|</span> <span className="text-gray-800 dark:text-white font-bold">{location.pathname === '/' ? 'Parent Portal Home' : location.pathname.substring(1).toUpperCase().replace('-', ' ')}</span>
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            
            <ThemeToggle />

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 cursor-pointer relative"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              </button>

              {/* Notifications dropdown menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-primary border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-850 text-xs">
                    <span className="font-bold text-gray-900 dark:text-white">Announcements</span>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-accent hover:underline cursor-pointer">dismiss</button>
                  </div>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-lg text-left transition-colors">
                        <h4 className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{n.title}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{n.desc}</p>
                        <span className="text-[8px] text-gray-400 dark:text-gray-550 mt-1 block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar menu */}
            <div className="relative">
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                className="flex items-center space-x-2 p-1 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-850 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#E5E5E5] text-[#14213D] font-bold flex items-center justify-center text-xs">
                  {user?.first_name?.charAt(0) || <User size={16} />}
                </div>
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-primary border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-850 text-left">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{user?.first_name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold bg-[#E5E5E5] text-[#14213D] px-1.5 py-0.5 rounded-full uppercase">
                      PARENT PORTAL
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
                </div>
              )}
            </div>

          </div>
        </header>

        {/* View content container */}
        <main className="p-6 flex-1 overflow-x-hidden">
          {children}
        </main>
        
      </div>
    </div>
  );
};

export default MainLayout;
