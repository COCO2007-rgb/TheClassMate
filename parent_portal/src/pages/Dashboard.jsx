import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Bookmark, Award, Bell, Sparkles, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, cache, updateCache } = useAuth();
  const [stats, setStats] = useState(cache.dashboard?.stats || {
    total_students: 1,
    total_batches: 0,
    today_attendance: '100%',
    fees_collected: 0
  });
  const [notifications, setNotifications] = useState(cache.dashboard?.notifications || []);
  const [loading, setLoading] = useState(!cache.dashboard);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, notifRes] = await Promise.all([
          api.get('/dashboard/stats/'),
          api.get('/notifications/')
        ]);
        setStats(statsRes.data);
        setNotifications(notifRes.data);
        updateCache('dashboard', { stats: statsRes.data, notifications: notifRes.data });
      } catch (err) {
        console.error('Failed to load parent dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Syncing child academic profile details...</span>
      </div>
    );
  }

  // Parse attendance percentage
  const attendanceVal = parseInt(stats.today_attendance) || 100;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attendanceVal / 100) * circumference;

  return (
    <div className="space-y-6">
      
      {/* 1. Welcoming Hero Banner */}
      <div className="bg-gradient-to-r from-[#14213D] to-[#1e325c] border border-[#2c3e60] rounded-2xl p-5 text-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden text-left">
        <div className="absolute right-[-15px] top-[-15px] w-24 h-24 bg-[#FCA311]/20 rounded-full blur-2xl"></div>
        <div className="flex items-center space-x-2 text-accent text-[10px] font-bold tracking-wider uppercase mb-1">
          <Sparkles size={12} />
          <span>APEX COACHING</span>
        </div>
        <h2 className="text-base font-bold tracking-tight">Welcome, {user?.first_name || 'Parent'}!</h2>
        <p className="text-[11px] text-gray-300 mt-1 leading-relaxed max-w-sm">
          Keep track of your child's batch schedule, daily lecture attendance indices, and monthly financial ledgers.
        </p>
      </div>

      {/* 2. Visual KPIs & Progress Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Attendance Progress Ring */}
        <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Class Attendance</span>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">{stats.today_attendance}</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Overall study attendance rate</p>
          </div>
          
          {/* Circular SVG Ring */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r={radius} stroke="#e5e7eb" strokeWidth="5.5" fill="transparent" className="dark:stroke-gray-800" />
              <circle cx="40" cy="40" r={radius} stroke="#FCA311" strokeWidth="5.5" fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-gray-900 dark:text-white">{stats.today_attendance}</span>
          </div>
        </div>

        {/* Financial Progress Bar */}
        <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between text-left space-y-3">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Tuition Payments</span>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">₹{stats.fees_collected}</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Receipt size={16} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${Math.min(100, (stats.fees_collected / 15000) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[8px] font-bold text-gray-400">
              <span>PAID IN FULL</span>
              <span>ESTIMATED CYCLE: ₹15,000</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Announcements Broadcast Feed */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase font-extrabold text-gray-900 dark:text-white tracking-wider text-left">Academy Broadcast Feed</h3>
          <div className="p-1.5 bg-accent/15 text-accent rounded-lg">
            <Bell size={14} />
          </div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No announcements posted from tuition staff.</p>
          ) : (
            notifications.map((n, index) => (
              <div key={n.id || index} className="p-3 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-left transition-colors border border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">{n.title}</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-450 mt-1 leading-relaxed">{n.description}</p>
                <span className="text-[8px] text-gray-400 mt-1.5 block font-medium">{n.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
