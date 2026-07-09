import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar, Filter, Save, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

const Attendance = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
      }
    };
    fetchBatches();
  }, []);

  const loadAttendanceMatrix = async () => {
    if (!selectedBatch || !selectedDate) return;
    setLoading(true);
    setMessage('');
    try {
      // 1. Fetch students in the selected batch
      const studRes = await api.get('/students/');
      const batchStudents = studRes.data.filter(s => s.batch_ids && s.batch_ids.includes(selectedBatch));
      setStudents(batchStudents);

      // 2. Fetch attendance log for this date and batch
      const attRes = await api.get(`/attendance/?batch_id=${selectedBatch}&date=${selectedDate}`);
      
      // Map students to status record
      const existingRecords = attRes.data.records || [];
      const mappedRecords = batchStudents.map(student => {
        const matchingRecord = existingRecords.find(r => r.student_id === student.id);
        return {
          student_id: student.id,
          student_name: student.name,
          student_code: student.student_id,
          status: matchingRecord ? matchingRecord.status : 'Present', // Default to Present
          remarks: matchingRecord ? matchingRecord.remarks || '' : ''
        };
      });
      setRecords(mappedRecords);
    } catch (err) {
      console.error('Failed to load attendance matrix:', err);
      setMessage('Failed to load attendance matrix logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceMatrix();
  }, [selectedBatch, selectedDate]);

  const handleStatusChange = (studentId, status) => {
    setRecords(records.map(r => r.student_id === studentId ? { ...r, status } : r));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setRecords(records.map(r => r.student_id === studentId ? { ...r, remarks } : r));
  };

  const handleBulkToggle = (status) => {
    setRecords(records.map(r => ({ ...r, status })));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.post('/attendance/', {
        batch_id: selectedBatch,
        date: selectedDate,
        records: records
      });
      setMessage('Attendance logs successfully committed to database!');
    } catch (err) {
      console.error('Save attendance error:', err);
      setMessage('Failed to save attendance logs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Attendance Matrix</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review, log, and bulk-check daily attendance worksheets</p>
      </div>

      {/* Selector Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm">
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Select Batch</label>
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
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Select Lecture Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-250 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
          />
        </div>
        
        {/* Bulk tools */}
        <div className="flex flex-col justify-end">
          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Bulk Operations</label>
          <div className="flex space-x-1">
            {['Present', 'Absent', 'Late', 'Half Day'].map((st) => (
              <button
                key={st}
                onClick={() => handleBulkToggle(st)}
                className="flex-1 py-1.5 border border-gray-200 dark:border-gray-750 hover:bg-gray-100 bg-gray-50 dark:bg-gray-800 hover:dark:bg-gray-700 rounded text-[9px] font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                All {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message feedback */}
      {message && (
        <div className="p-3 bg-accent/15 border border-accent/30 rounded-lg text-xs text-primary dark:text-accent font-semibold text-center">
          {message}
        </div>
      )}

      {/* Spreadsheet grid */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading attendance rows...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">No students matching the selected batch.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-850/50 border-b border-gray-150 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                  <th className="p-4">Student ID</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Status Toggles</th>
                  <th className="p-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-xs">
                {records.map((row) => (
                  <tr key={row.student_id} className="hover:bg-gray-50/30 dark:hover:bg-gray-850/30 transition-all">
                    <td className="p-4 font-bold text-primary dark:text-accent font-mono">{row.student_code}</td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{row.student_name}</td>
                    
                    {/* Status selectors */}
                    <td className="p-4">
                      <div className="flex space-x-1.5">
                        {[
                          { val: 'Present', color: 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200 dark:border-green-800', icon: CheckCircle },
                          { val: 'Absent', color: 'bg-red-55 text-red-700 dark:bg-red-955/20 dark:text-red-400 border-red-200 dark:border-red-800', icon: XCircle },
                          { val: 'Late', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: Clock },
                          { val: 'Half Day', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-800', icon: AlertTriangle }
                        ].map((btn) => {
                          const isSelected = row.status === btn.val;
                          return (
                            <button
                              key={btn.val}
                              onClick={() => handleStatusChange(row.student_id, btn.val)}
                              className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all ${isSelected ? btn.color + ' border-transparent ring-2 ring-accent/20' : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                              <btn.icon size={12} />
                              <span>{btn.val}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Remarks input */}
                    <td className="p-4">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(e) => handleRemarksChange(row.student_id, e.target.value)}
                        placeholder="E.g., Medical leave"
                        className="w-full max-w-xs p-1.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Floating save triggers */}
        <div className="p-4 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-850 flex justify-end">
          <button
            onClick={handleSaveAttendance}
            disabled={saving || records.length === 0}
            className="px-5 py-2.5 bg-accent hover:opacity-90 disabled:opacity-50 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Commit Attendance'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default Attendance;
