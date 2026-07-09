import React, { useEffect, useState } from 'react';
import api from '../services/api';
import KPICard from '../components/KPICard';
import { Users, Layers, CalendarCheck, Landmark, Clock, Award, History, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_students: 0,
    total_batches: 0,
    today_attendance: '100%',
    fees_collected: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await api.get('/dashboard/stats/');
        setStats(statsRes.data);

        const logsRes = await api.get('/audit-logs/');
        setRecentLogs(logsRes.data.slice(0, 5));

        const timeRes = await api.get('/timetable/');
        setTimetable(timeRes.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading) {
      gsap.fromTo('.kpi-card-anim',
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.5)' }
      );
      
      gsap.fromTo('.chart-card-anim',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.3, stagger: 0.15, ease: 'power2.out' }
      );
      
      gsap.fromTo('.activity-card-anim',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.5, ease: 'power2.out' }
      );
    }
  }, [loading]);

  // Performance Chart simulation data
  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Collected Fees (₹)',
        data: [1200, 1900, 3000, 5000, 4800, 6200, stats.fees_collected || 4000],
        borderColor: '#FCA311',
        backgroundColor: 'rgba(252, 163, 17, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { borderDash: [4, 4] } }
    }
  };

  const pieData = {
    labels: ['Mathematics', 'Physics', 'Chemistry'],
    datasets: [
      {
        data: [45, 30, 25],
        backgroundColor: ['#FCA311', '#14213D', '#E5E5E5'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 1,
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#888888',
          boxWidth: 10,
          font: { size: 9 }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading dashboard telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 4 KPIs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          className="kpi-card-anim"
          title="Total Students"
          value={stats.total_students}
          icon={Users}
          description="Active student directory"
          trend="+8%"
          onClick={() => navigate('/students')}
        />
        <KPICard
          className="kpi-card-anim"
          title="Active Batches"
          value={stats.total_batches}
          icon={Layers}
          description="Batches / Classes structured"
          onClick={() => navigate('/batches')}
        />
        <KPICard
          className="kpi-card-anim"
          title="Today's Attendance"
          value={stats.today_attendance}
          icon={CalendarCheck}
          description="Self attendance matrix status"
          trend="+1.2%"
          onClick={() => navigate('/attendance')}
        />
        <KPICard
          className="kpi-card-anim"
          title="Monthly Fee Collection"
          value={`₹${stats.fees_collected}`}
          icon={Landmark}
          description="Collected ledger revenue"
          trend="+15%"
          onClick={() => navigate('/fees')}
        />
      </div>

      {/* Row 2: Charts and Upcoming schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fees Trend line chart */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between chart-card-anim">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Tuition Financial Trends</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Summary of collected fee logs over the past months</p>
            </div>
            <span className="text-xs bg-[#E5E5E5] dark:bg-gray-800 px-2 py-1 rounded text-primary dark:text-accent font-semibold">Line Matrix</span>
          </div>
          <div className="h-64">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Timetable slots */}
        <div className="p-6 rounded-xl bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between chart-card-anim">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Today's Class Schedule</h3>
              <Clock size={16} className="text-accent" />
            </div>
            <div className="space-y-3.5">
              {timetable.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No classes scheduled for today.</p>
              ) : (
                timetable.map((slot, index) => (
                  <div key={slot.id || index} className="p-3 bg-gray-50 dark:bg-gray-850 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">{slot.subject}</h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Batch: {slot.batch_name}</p>
                    </div>
                    <span className="text-[10px] bg-primary/10 dark:bg-white/10 text-primary dark:text-white px-2 py-0.5 rounded font-medium">
                      {slot.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/batches')}
            className="w-full mt-4 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>View All Schedules</span>
            <ArrowRight size={12} />
          </button>
        </div>

      </div>

      {/* Row 3: Recent Activity Logs & Student Info Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Logs */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 shadow-sm activity-card-anim">
          <div className="flex items-center space-x-2 mb-4">
            <History size={16} className="text-accent" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Workspace Activity Log</h3>
          </div>
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No recent activities logged.</p>
            ) : (
              recentLogs.map((log, index) => (
                <div key={log.id || index} className="flex items-start justify-between text-xs pb-3 border-b border-gray-100 dark:border-gray-850 last:border-b-0 last:pb-0">
                  <div>
                    <span className="font-bold text-gray-950 dark:text-white">{log.action}</span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{log.details}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-gray-400 dark:text-gray-500">{log.timestamp}</span>
                    <p className="text-[9px] font-medium text-accent mt-0.5">{log.user}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Student Info Doughnut/Pie Chart */}
        <div className="p-6 rounded-xl bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between activity-card-anim">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Student Program Distribution</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Enrolments by subject domain</p>
          </div>
          <div className="h-44 my-2 flex items-center justify-center">
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center border-t border-gray-100 dark:border-gray-850 pt-2 font-semibold">
            Total Enrolled: {stats.total_students} Students
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
