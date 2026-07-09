import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Calendar, Trash2, Award, BookOpen, Layers } from 'lucide-react';
import Modal from '../components/Modal';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Exam Form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('');
  const [subject, setSubject] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('33');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const subjectsList = [
    'Mathematics',
    'Science',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
    'Geography',
    'Computer Science'
  ];

  const fetchData = async () => {
    try {
      const exRes = await api.get('/exams/');
      setExams(exRes.data);

      const batRes = await api.get('/batches/');
      setBatches(batRes.data);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setError('');

    if (!batchId || !name || !maxMarks || !passingMarks || !date || !standard || !subject) {
      setError('All fields are required.');
      return;
    }

    const selectedBat = batches.find(b => b.id === batchId);

    try {
      await api.post('/exams/', {
        batch_id: batchId,
        batch_name: selectedBat?.name || 'Unknown',
        test_name: name,
        standard,
        subject,
        total_marks: parseFloat(maxMarks),
        passing_marks: parseFloat(passingMarks),
        exam_date: date,
        marks: []
      });

      setBatchId('');
      setName('');
      setStandard('');
      setSubject('');
      setMaxMarks('100');
      setPassingMarks('33');
      setDate('');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to schedule exam.');
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.delete('/exams/', { data: { id } });
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading scheduled tests list...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-sans">Scheduled Exams & Tests</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Schedule new tests, define grading criteria, and manage student exam records</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-accent hover:opacity-90 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Schedule New Test</span>
        </button>
      </div>

      {/* Grid of scheduled exams */}
      {exams.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">No tests scheduled yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((ex, index) => (
            <div key={ex.id || index} className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
              
              <div className="p-5 border-b border-gray-100 dark:border-gray-850">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {ex.batch_name}
                  </span>
                  {ex.standard && (
                    <span className="text-[9px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full uppercase">
                      Std: {ex.standard}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-2 truncate">{ex.test_name || ex.title}</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                  <BookOpen size={10} className="mr-1 text-accent" />
                  <span>Subject: <span className="font-semibold text-gray-800 dark:text-white">{ex.subject || 'N/A'}</span></span>
                </p>
              </div>

              <div className="p-5 space-y-3 flex-1 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-2 text-accent" />
                  <span>Date: <span className="font-bold text-gray-900 dark:text-white">{ex.exam_date || ex.date}</span></span>
                </div>
                <div className="flex items-center justify-between text-[11px] bg-gray-50 dark:bg-gray-850 p-2 rounded-lg">
                  <span>Total: <span className="font-bold text-gray-900 dark:text-white">{ex.total_marks || ex.max_marks} M</span></span>
                  <span>Passing: <span className="font-bold text-red-500">{ex.passing_marks} M</span></span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-850 flex justify-end">
                <button
                  onClick={() => handleDeleteExam(ex.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer"
                  title="Delete exam"
                >
                  <Trash2 size={14} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Schedule New Test">
        <form onSubmit={handleCreateExam} className="space-y-4">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold text-center">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Select Batch Program *</label>
              <select
                required
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="">Select Batch</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Standard / Grade *</label>
              <input
                type="text"
                required
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                placeholder="E.g., Class 10"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Test Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Kinematics Unit Test"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Subject Topic *</label>
              <select
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="">Select Subject</option>
                {subjectsList.map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Total Marks *</label>
              <input
                type="number"
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                placeholder="E.g., 100"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Passing Marks *</label>
              <input
                type="number"
                required
                value={passingMarks}
                onChange={(e) => setPassingMarks(e.target.value)}
                placeholder="E.g., 33"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Exam Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-gray-55 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 font-sans">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-lg text-xs hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:opacity-90 cursor-pointer"
            >
              Schedule
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Exams;