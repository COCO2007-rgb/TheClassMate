import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const Attendance = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await api.get('/batches/');
        setBatches(response.data);
        if (response.data.length > 0) {
          setSelectedBatch(response.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load batches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  const loadAttendanceHistory = async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      // Fetch child profile to identify ID
      const userRes = await api.get('/auth/profile/');
      // We will queries student list (returns only current parent's child profile in restructured backend!)
      const studRes = await api.get('/students/');
      const child = studRes.data[0];

      if (!child) return;

      // Simulate queries attendance logs over dates
      const dates = [
        '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05'
      ];
      
      const recordsList = [];
      for (const d of dates) {
        try {
          const res = await api.get(`/attendance/?batch_id=${selectedBatch}&date=${d}`);
          if (res.data && res.data.records) {
            const childRec = res.data.records.find(r => r.student_id === child.id);
            if (childRec) {
              recordsList.push({
                date: d,
                status: childRec.status,
                remarks: childRec.remarks || 'Normal class'
              });
            }
          }
        } catch (e) {
          // ignore date logs
        }
      }
      setHistory(recordsList.reverse());
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceHistory();
  }, [selectedBatch]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white font-sans">Attendance Matrix Log</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review lecture dates logs and child's logged attendance records</p>
      </div>

      {/* Select Batch toolbar */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm max-w-md">
        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Filter by Class Program</label>
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="w-full p-2 bg-gray-50 dark:bg-gray-850 border border-gray-250 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
        >
          {batches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Calendar List */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-xs text-gray-400">Loading daily attendance records...</p>
        ) : history.length === 0 ? (
          <p className="p-8 text-center text-xs text-gray-400">No attendance registered for this study batch.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-850">
            {history.map((row, index) => {
              const Icon = row.status === 'Present' ? CheckCircle : row.status === 'Absent' ? XCircle : row.status === 'Late' ? Clock : AlertTriangle;
              const color = row.status === 'Present' ? 'text-green-500 bg-green-500/10' : row.status === 'Absent' ? 'text-red-500 bg-red-500/10' : row.status === 'Late' ? 'text-amber-500 bg-amber-500/10' : 'text-blue-500 bg-blue-500/10';

              return (
                <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors text-xs">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{row.date}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Remarks: {row.remarks}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold border border-transparent ${color}`}>
                    {row.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Attendance;
