import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Search, Plus, Filter, FileSpreadsheet, Trash2, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');

  // Add student modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [studentContact, setStudentContact] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [joiningDate, setJoiningDate] = useState('');
  const [batchId, setBatchId] = useState('');
  const [error, setError] = useState('');

  // Promote student modal
  const [promoteStudent, setPromoteStudent] = useState(null);
  const [targetBatchId, setTargetBatchId] = useState('');

  const fetchData = async () => {
    try {
      const studRes = await api.get('/students/');
      setStudents(studRes.data);

      const batRes = await api.get('/batches/');
      setBatches(batRes.data);
    } catch (err) {
      console.error('Failed to load students directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !studentContact || !batchId) {
      setError('First name, student contact number, and batch assignment are required.');
      return;
    }

    try {
      await api.post('/students/', {
        name,
        surname,
        mobile: studentContact, // map for backward compatibility
        student_contact: studentContact,
        parent_contact: parentContact,
        address,
        dob,
        gender,
        joining_date: joiningDate || new Date().toISOString().split('T')[0],
        batch_ids: [batchId],
      });
      
      setName('');
      setSurname('');
      setStudentContact('');
      setParentContact('');
      setAddress('');
      setDob('');
      setGender('Male');
      setJoiningDate('');
      setBatchId('');
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add student.');
    }
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (!targetBatchId || !promoteStudent) return;

    try {
      await api.post(`/students/${promoteStudent.id}/promote/`, {
        target_batch_id: targetBatchId
      });
      setPromoteStudent(null);
      setTargetBatchId('');
      fetchData();
    } catch (err) {
      console.error('Promotion failed:', err);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to move this student to the recycle bin?')) return;
    try {
      await api.delete(`/students/${id}/`);
      fetchData();
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  // Export report to CSV
  const handleExportCSV = () => {
    const token = localStorage.getItem('theclassmate_token');
    window.open(`http://localhost:8000/api/export/students/?token=${token}`, '_blank');
  };

  // Filter students based on search query and batch selector
  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name || s.name || ''} ${s.surname || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) ||
                          s.student_id?.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = selectedBatch === 'all' || (s.batch_ids && s.batch_ids.includes(selectedBatch));
    return matchesSearch && matchesBatch;
  });

  const getBatchNames = (studentBatchIds) => {
    if (!studentBatchIds) return '';
    return studentBatchIds
      .map(id => batches.find(b => b.id === id)?.name || '')
      .filter(Boolean)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading students directory list...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-sans">Students Directory</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage student profiles, enrollments, registrations and academic promotions</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850 flex items-center space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-accent hover:opacity-90 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm">
        
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search student name, ID or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
          />
        </div>

        {/* Batch selection dropdown */}
        <div className="flex items-center space-x-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="p-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
          >
            <option value="all">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-850/50 border-b border-gray-150 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                <th className="p-4">Student ID</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Student Mob</th>
                <th className="p-4">Parent Mob</th>
                <th className="p-4">Joining Date</th>
                <th className="p-4">Enrolled Batch</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    No students matching the query directory criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, index) => (
                  <tr key={s.id || index} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition-all">
                    <td className="p-4 font-bold text-primary dark:text-accent font-mono">{s.student_id}</td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{s.first_name || s.name} {s.surname || ''}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{s.student_contact || s.mobile}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{s.parent_contact || 'N/A'}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{s.joining_date || 'N/A'}</td>
                    <td className="p-4 font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{getBatchNames(s.batch_ids)}</td>
                    <td className="p-4 text-right flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setPromoteStudent(s)}
                        className="p-1.5 text-accent hover:bg-accent/15 rounded cursor-pointer"
                        title="Transfer to another batch"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(s.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer"
                        title="Archive / Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Student">
        <form onSubmit={handleAddStudent} className="space-y-4">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold text-center">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Student First Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-sans"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Surname</label>
              <input
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Doe"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-sans"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Student Contact Number *</label>
              <input
                type="text"
                required
                value={studentContact}
                onChange={(e) => setStudentContact(e.target.value)}
                placeholder="E.g., 9876543210"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-sans"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Parent Contact Number</label>
              <input
                type="text"
                value={parentContact}
                onChange={(e) => setParentContact(e.target.value)}
                placeholder="E.g., 9876543211"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-sans"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">DOB</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-sans"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-sans"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Residential Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter student residential address"
              rows="2"
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-sans"
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Joining / Start Date</label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-sans"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Assign Batch *</label>
              <select
                required
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white cursor-pointer font-sans"
              >
                <option value="">Select Batch</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4 font-sans">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-lg text-xs hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:opacity-90 cursor-pointer"
            >
              Register
            </button>
          </div>
        </form>
      </Modal>

      {/* Promote / Transfer Student Modal */}
      {promoteStudent && (
        <Modal isOpen={!!promoteStudent} onClose={() => setPromoteStudent(null)} title={`Transfer Student - ${promoteStudent.name || promoteStudent.first_name}`}>
          <form onSubmit={handlePromoteSubmit} className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Transfer student <span className="font-bold">{promoteStudent.first_name || promoteStudent.name}</span> ({promoteStudent.student_id}) to another batch list.
            </p>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Target Batch</label>
              <select
                required
                value={targetBatchId}
                onChange={(e) => setTargetBatchId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              >
                <option value="">Select Target Batch</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => setPromoteStudent(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-lg text-xs hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:opacity-90 cursor-pointer"
              >
                Transfer Student
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};  

export default Students;
