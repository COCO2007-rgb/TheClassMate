import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Terminal, Database, Server, Settings, ShieldAlert, Download, Upload, AlertCircle, RefreshCw } from 'lucide-react';
import { Line } from 'react-chartjs-2';

const DeveloperDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  
  // Backup file state
  const [backupFile, setBackupFile] = useState(null);
  const [backupMessage, setBackupMessage] = useState('');
  const [restoring, setRestoring] = useState(false);

  const fetchDeveloperStats = async () => {
    try {
      const response = await api.get('/developer/stats/');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load developer stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeveloperStats();
  }, []);

  const handleClearDb = async () => {
    if (!window.confirm('WARNING: Are you sure you want to CLEAR all mock databases? All student lists, attendance records, ledgers, and scheduled exams will be PERMANENTLY deleted!')) return;
    setClearing(true);
    setBackupMessage('');
    try {
      const response = await api.post('/developer/db/clear/');
      alert(response.data.message);
      fetchDeveloperStats();
    } catch (err) {
      console.error('Failed to clear collections:', err);
    } finally {
      setClearing(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('http://localhost:8000/api/backup/', '_blank');
  };

  const handleUploadBackup = async (e) => {
    e.preventDefault();
    if (!backupFile) return;
    setRestoring(true);
    setBackupMessage('');

    const formData = new FormData();
    formData.append('backup_file', backupFile);

    try {
      const response = await api.post('/backup/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setBackupMessage(response.data.message);
      fetchDeveloperStats();
    } catch (err) {
      setBackupMessage(err.response?.data?.error || 'Database restore failed.');
    } finally {
      setRestoring(false);
    }
  };

  const cpuChartData = {
    labels: ['10s ago', '8s ago', '6s ago', '4s ago', '2s ago', 'Now'],
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: [14.2, 18.5, 12.1, 10.9, 15.6, stats?.server_load?.cpu_percent || 12.4],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Initializing Super Admin Shell environment...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="text-emerald-400" size={24} />
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Developer Shell & Analytics</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Real-time resource utilization, mock collection sizes, and local restore points</p>
          </div>
        </div>
        
        <span className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono px-2.5 py-1 rounded">
          Super Admin Console v1.0.2
        </span>
      </div>

      {backupMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 text-center">
          {backupMessage}
        </div>
      )}

      {/* Row 1: System Health & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Server stats */}
        <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-850">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center">
              <Server size={14} className="mr-2 text-emerald-400" /> Server Resources
            </h3>
            <span className="text-[10px] text-green-500 font-bold uppercase">Online</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Local Memory</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{stats?.server_load?.memory_usage_mb} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Local CPU Core</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{stats?.server_load?.cpu_percent}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Active Pool Connections</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{stats?.server_load?.active_connections} clients</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Storage Allocated Size</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">~342.0 KB</span>
            </div>
          </div>
        </div>

        {/* Realtime Resource Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2">CPU Utilization Telemetry</h3>
          <div className="h-44">
            <Line data={cpuChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

      </div>

      {/* Row 2: Database Sizes & License tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Collection stats */}
        <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Database size={14} className="mr-2 text-emerald-400" /> Collection Document Sizes
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {stats?.collections && Object.keys(stats.collections).map(colName => (
              <div key={colName} className="p-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg">
                <span className="text-[10px] text-gray-500 uppercase font-bold">{colName}</span>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono">{stats.collections[colName]}</p>
                <span className="text-[9px] text-gray-400 mt-1 block">documents synced</span>
              </div>
            ))}
          </div>
        </div>

        {/* License management */}
        <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Settings size={14} className="mr-2 text-emerald-400" /> Subscription Contracts
          </h3>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-850 text-xs">
            {stats?.subscriptions?.map((sub, index) => (
              <div key={index} className="py-2.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-950 dark:text-white">{sub.tuition_name}</h4>
                  <p className="text-[9px] text-gray-400 mt-0.5 uppercase">Plan: {sub.plan} • Expires: {sub.expires}</p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Backups & Debug utilities */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-6">
        
        {/* Backups section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-left">
            <h4 className="font-bold text-xs text-gray-900 dark:text-white flex items-center">
              <Download size={14} className="mr-1.5 text-accent" /> Export Database Backup
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Download the entire MongoDB collection dumps schema as a portable JSON backup file.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 bg-[#14213D] dark:bg-gray-800 hover:opacity-90 text-white rounded-lg text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
            >
              <Download size={12} />
              <span>Download .json Backup</span>
            </button>
          </div>

          <form onSubmit={handleUploadBackup} className="space-y-2.5 text-left border-l-0 md:border-l border-gray-100 dark:border-gray-850 md:pl-6">
            <h4 className="font-bold text-xs text-gray-900 dark:text-white flex items-center">
              <Upload size={14} className="mr-1.5 text-accent" /> Restore Database Backup
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Upload a previously exported backup file to overwrite current database configurations.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".json"
                required
                onChange={(e) => setBackupFile(e.target.files[0])}
                className="text-xs text-gray-500 dark:text-gray-400"
              />
              <button
                type="submit"
                disabled={restoring}
                className="px-4 py-2 bg-accent hover:opacity-90 text-primary font-bold rounded-lg text-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <Upload size={12} />
                <span>{restoring ? 'Restoring...' : 'Restore'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Clear database action */}
        <hr className="border-gray-100 dark:border-gray-850" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-red-500/5 p-4 rounded-xl border border-red-500/20">
          <div className="flex items-start space-x-3 text-left">
            <ShieldAlert size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-red-500">Database Debug Utility Zone</h4>
              <p className="text-[10px] text-gray-500 dark:text-gray-450 mt-1 max-w-xl">
                For evaluation/testing purposes. Clears all custom student listings, scheduling details, timetable grids, and exam sheets to seed a clean environment.
              </p>
            </div>
          </div>
          <button
            onClick={handleClearDb}
            disabled={clearing}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={clearing ? 'animate-spin' : ''} />
            <span>{clearing ? 'Clearing...' : 'Wipe Collections'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default DeveloperDashboard;
