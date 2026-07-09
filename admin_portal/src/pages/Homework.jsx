import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BookOpen, Plus, Calendar, CheckSquare, Save, ChevronRight, FileText } from 'lucide-react';
import Modal from '../components/Modal';

const Homework = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Homework Form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [error, setError] = useState('');

  // Submissions Modal states
  const [selectedHw, setSelectedHw] = useState(null);
  const [gradingMarks, setGradingMarks] = useState({});
  const [gradingRemarks, setGradingRemarks] = useState({});
  const [savingGrade, setSavingGrade] = useState(false);

  const fetchData = async () => {
    try {
      const hwRes = await api.get('/homework/');
      setHomeworks(hwRes.data);

      const batRes = await api.get('/batches/');
      setBatches(batRes.data);
    } catch (err) {
      console.error('Failed to load homework:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateHw = async (e) => {
    e.preventDefault();
    setError('');

    if (!batchId || !title || !due) {
      setError('Batch, title, and due date are required.');
      return;
    }

    const selectedBat = batches.find(b => b.id === batchId);

    try {
      await api.post('/homework/', {
        batch_id: batchId,
        batch_name: selectedBat?.name || 'Unknown',
        title,
        description,
        due,
        submissions: []
      });

      setBatchId('');
      setTitle('');
      setDescription('');
      setDue('');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign homework.');
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHw) return;
    setSavingGrade(true);

    try {
      // Update submissions array with entered grades
      const updatedSubmissions = selectedHw.submissions.map(sub => ({
        ...sub,
        marks: parseFloat(gradingMarks[sub.student_id] || sub.marks || 0),
        remarks: gradingRemarks[sub.student_id] || sub.remarks || '',
        graded: true
      }));

      await api.put('/homework/', {
        id: selectedHw.id,
        title: selectedHw.title,
        description: selectedHw.description,
        due: selectedHw.due,
        batch_id: selectedHw.batch_id,
        batch_name: selectedHw.batch_name,
        submissions: updatedSubmissions
      });

      setSelectedHw(null);
      fetchData();
    } catch (err) {
      console.error('Failed to submit grades:', err);
    } finally {
      setSavingGrade(false);
    }
  };

  const openGradingPanel = (hw) => {
    setSelectedHw(hw);
    const marksMap = {};
    const remarksMap = {};
    hw.submissions.forEach(sub => {
      marksMap[sub.student_id] = sub.marks || '';
      remarksMap[sub.student_id] = sub.remarks || '';
    });
    setGradingMarks(marksMap);
    setGradingRemarks(remarksMap);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading homework worksheets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Homework Assignments</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Assign, track, download student uploads, and evaluate homework sheets</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-accent hover:opacity-90 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>New Homework Assignment</span>
        </button>
      </div>

      {/* Grid of Homeworks */}
      {homeworks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">No homework has been assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeworks.map((hw, index) => (
            <div key={hw.id || index} className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
              
              <div className="p-5 border-b border-gray-100 dark:border-gray-850">
                <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {hw.batch_name}
                </span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-2 truncate">{hw.title}</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">{hw.description}</p>
              </div>

              <div className="p-5 space-y-3 flex-1 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-2 text-accent" />
                  <span>Due: <span className="font-bold text-gray-900 dark:text-white">{hw.due}</span></span>
                </div>
                <div className="flex items-center">
                  <CheckSquare size={14} className="mr-2 text-accent" />
                  <span>Submissions: <span className="font-bold text-gray-900 dark:text-white">{hw.submissions?.length || 0} uploads</span></span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-850 flex justify-end">
                <button
                  onClick={() => openGradingPanel(hw)}
                  className="px-3 py-1.5 bg-[#14213D] dark:bg-gray-800 hover:opacity-90 text-white rounded text-[10px] font-bold flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <span>Evaluate Submissions</span>
                  <ChevronRight size={10} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Create Homework Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="New Homework Assignment">
        <form onSubmit={handleCreateHw} className="space-y-4">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold text-center">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Select Batch Program *</label>
            <select
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
            >
              <option value="">Select Batch</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Assignment Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Kinematics Worksheet 1"
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Detailed Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Solve all 10 questions of the attached Kinematics sheet. Submit as PDF."
              rows="3"
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
            ></textarea>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Due Date *</label>
            <input
              type="date"
              required
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
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
              Assign Homework
            </button>
          </div>
        </form>
      </Modal>

      {/* Evaluate Submissions Modal */}
      {selectedHw && (
        <Modal isOpen={!!selectedHw} onClose={() => setSelectedHw(null)} title={`Evaluate - ${selectedHw.title}`}>
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-850 p-3.5 rounded border border-gray-150 dark:border-gray-800 text-xs">
              <span className="font-bold text-gray-900 dark:text-white">{selectedHw.title}</span>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{selectedHw.description || 'No description provided.'}</p>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              {selectedHw.submissions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No uploads submitted for this assignment yet.</p>
              ) : (
                selectedHw.submissions.map((sub) => (
                  <div key={sub.student_id} className="p-3 bg-white dark:bg-primary border border-gray-200 dark:border-gray-850 rounded-lg space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-900 dark:text-white">{sub.student_name}</span>
                      <a
                        href={sub.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline inline-flex items-center space-x-1"
                      >
                        <FileText size={12} />
                        <span>Download PDF</span>
                      </a>
                    </div>
                    
                    {/* Scores & Comments row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Score / Marks</label>
                        <input
                          type="number"
                          value={gradingMarks[sub.student_id] || ''}
                          onChange={(e) => setGradingMarks({ ...gradingMarks, [sub.student_id]: e.target.value })}
                          placeholder="E.g., 90"
                          className="w-full p-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded text-xs outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Teacher Review Remarks</label>
                        <input
                          type="text"
                          value={gradingRemarks[sub.student_id] || ''}
                          onChange={(e) => setGradingRemarks({ ...gradingRemarks, [sub.student_id]: e.target.value })}
                          placeholder="E.g., Good effort"
                          className="w-full p-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded text-xs outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-150 dark:border-gray-850">
              <button
                type="button"
                onClick={() => setSelectedHw(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-lg text-xs hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingGrade || selectedHw.submissions.length === 0}
                className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:opacity-90 flex items-center space-x-1 cursor-pointer"
              >
                <Save size={14} />
                <span>{savingGrade ? 'Submitting...' : 'Commit Evaluations'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default Homework;
