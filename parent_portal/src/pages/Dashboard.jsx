import React, { useEffect, useState } from 'react';
import api from '../services/api';
import KPICard from '../components/KPICard';
import { CalendarDays, BookOpen, AlertCircle, Bookmark, Clock, Award, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_students: 1,
    total_batches: 0,
    today_attendance: '100%',
    fees_collected: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const statsRes = await api.get('/dashboard/stats/');
        setStats(statsRes.data);

        const notifRes = await api.get('/notifications/');
        setNotifications(notifRes.data);
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

  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Overall Attendance Rate"
          value={stats.today_attendance}
          icon={CalendarDays}
          description="Total lectures attended"
        />
        <KPICard
          title="Enrolled Study Programs"
          value={stats.total_batches}
          icon={Bookmark}
          description="Active batch registrations"
        />
        <KPICard
          title="Total Paid Tuition Fees"
          value={`₹${stats.fees_collected}`}
          icon={Award}
          description="Fees ledger logs"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Notices & Broadcast Banner */}
        <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Academy Broadcast Feed</h3>
            <Bell size={16} className="text-accent" />
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No announcements from coaching staff.</p>
            ) : (
              notifications.map((n, index) => (
                <div key={n.id || index} className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-lg text-left transition-colors border border-gray-100 dark:border-gray-800">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">{n.title}</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{n.description}</p>
                  <span className="text-[8px] text-gray-400 mt-1 block">{n.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
