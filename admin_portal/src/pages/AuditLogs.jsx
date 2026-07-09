import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { History, ShieldAlert, Clock, Search } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/audit-logs/');
        setLogs(response.data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    return l.action?.toLowerCase().includes(search.toLowerCase()) ||
           l.details?.toLowerCase().includes(search.toLowerCase()) ||
           l.user?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading workspace audit logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Workspace Audit Logs</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Track and monitor security activities, administrator logins and database updates</p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search logs by action, remarks or teacher name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Showing {filteredLogs.length} logged actions
        </div>
      </div>

      {/* Audit Log Timeline list */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-6">
        <div className="relative border-l-2 border-gray-100 dark:border-gray-800 pl-6 ml-3 space-y-6 text-xs text-left">
          
          {filteredLogs.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6 ml-[-24px]">No audit logs matched your query.</p>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={log.id || index} className="relative">
                {/* Timeline dot */}
                <span className="absolute -left-[31px] top-0.5 p-1 rounded-full bg-accent text-[#14213D] border-4 border-white dark:border-primary flex items-center justify-center">
                  <ShieldAlert size={10} />
                </span>
                
                {/* Log Info */}
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-gray-950 dark:text-white text-sm">{log.action}</span>
                    <span className="text-[10px] bg-[#E5E5E5] dark:bg-gray-800 text-gray-700 dark:text-gray-350 px-2 py-0.5 rounded font-semibold uppercase">
                      {log.user}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">{log.details}</p>
                  
                  <div className="flex items-center text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                    <Clock size={10} className="mr-1" />
                    <span>Timestamp: {log.timestamp} UTC</span>
                  </div>
                </div>
              </div>
            ))
          )}

        </div>
      </div>

    </div>
  );
};

export default AuditLogs;
