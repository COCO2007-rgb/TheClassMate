import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Layers, Plus, Bookmark, ArrowRight, Users, Search, ChevronDown, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

const Batches = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New batch form state
  const [name, setName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState(['Mathematics']);
  const [fees, setFees] = useState('');
  const [error, setError] = useState('');
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);

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

  const fetchBatches = async () => {
    try {
      const response = await api.get('/batches/');
      setBatches(response.data);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || selectedSubjects.length === 0 || !fees) {
      setError('All fields are required. Please select at least one subject.');
      return;
    }

    try {
      await api.post('/batches/', {
        name,
        multiple_subjects: selectedSubjects.join(', '),
        subject: selectedSubjects.join(', '),
        fees: parseFloat(fees)
      });
      setName('');
      setSelectedSubjects(['Mathematics']);
      setFees('');
      setIsModalOpen(false);
      fetchBatches();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create batch.');
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (batch.multiple_subjects || batch.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading batches directories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Structured Batches</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Structurize study programs and link student groups</p>
        </div>
        <div className="flex items-center space-x-3 self-end sm:self-auto">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search batches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-primary border border-gray-200 dark:border-gray-800 text-xs rounded-lg outline-none focus:border-accent text-gray-900 dark:text-white w-48 transition-all"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-accent hover:opacity-90 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Batch</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      {filteredBatches.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">No batches matched your search filter.</p>
          {batches.length === 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-accent text-primary font-bold text-xs rounded-lg hover:opacity-90 inline-flex items-center space-x-1 cursor-pointer"
            >
              <Plus size={14} /> <span>Add First Batch</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch, index) => (
            <motion.div
              key={batch.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group"
            >
              {/* Card Header Banner */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-850">
                <span className="text-[10px] uppercase font-bold text-accent tracking-wider bg-accent/10 px-2 py-0.5 rounded-full">
                  {batch.subject}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-2 group-hover:text-accent transition-colors">
                  {batch.name} ({batch.student_count || 0})
                </h3>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3.5 flex-1">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Users size={14} className="mr-2 text-accent" />
                  <span>Enrolled Students: <span className="font-bold text-gray-900 dark:text-white">{batch.student_count || 0}</span></span>
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Bookmark size={14} className="mr-2 text-accent" />
                  <span>Unique Code: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-900 dark:text-white font-bold">{batch.code}</code></span>
                </div>
              </div>

              {/* Card Footer controls */}
              <div className="p-4 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-850 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  ₹{batch.fees} <span className="font-medium text-[10px] text-gray-400">/ mo</span>
                </span>
                <button
                  onClick={() => navigate(`/batches/${batch.id}`)}
                  className="px-3.5 py-1.5 bg-[#14213D] hover:bg-[#1d2d4f] dark:bg-gray-800 dark:hover:bg-gray-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all"
                >
                  <span>Manage Batch</span>
                  <ArrowRight size={10} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Batch Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Batch">
        <form onSubmit={handleCreateBatch} className="space-y-4">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold text-center">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Batch Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Grade 10 Physics Core"
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-sans"
            />
          </div>
          <div className="relative">
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Subject Area(s) *</label>
            <button
              type="button"
              onClick={() => setShowSubjectMenu(!showSubjectMenu)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white flex items-center justify-between cursor-pointer font-sans"
            >
              <span className="truncate">{selectedSubjects.length > 0 ? selectedSubjects.join(', ') : 'Select Subjects'}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            
            {showSubjectMenu && (
              <div className="absolute left-0 right-0 mt-1 p-3 bg-white dark:bg-[#14213D] border border-gray-200 dark:border-gray-750 rounded-lg shadow-xl z-50 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {subjectsList.map((subj) => (
                  <label key={subj} className="flex items-center space-x-2 text-xs font-semibold text-gray-750 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subj)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubjects([...selectedSubjects, subj]);
                        } else {
                          setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
                        }
                      }}
                      className="rounded border-gray-300 text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                    />
                    <span>{subj}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Monthly Fees (₹)</label>
            <input
              type="number"
              required
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              placeholder="E.g., 1200"
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-sans"
            />
          </div>
          <div className="flex justify-end space-x-2.5 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:opacity-90 cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Batches;
