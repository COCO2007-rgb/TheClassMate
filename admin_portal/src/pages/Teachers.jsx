import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../components/Modal';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Forms State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [statusVal, setStatusVal] = useState('Active');
  const [error, setError] = useState('');

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/teachers/');
      setTeachers(response.data);
    } catch (err) {
      console.error('Failed to load teachers list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !subject || !phone) {
      setError('Name, Subject, and Mobile Number are required.');
      return;
    }

    try {
      await api.post('/teachers/', {
        name,
        subject,
        phone,
        qualification,
        experience,
        status: statusVal
      });

      // Reset
      setName('');
      setSubject('');
      setPhone('');
      setQualification('');
      setExperience('');
      setStatusVal('Active');
      setIsAddModalOpen(false);
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add teacher.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !subject || !phone) {
      setError('Name, Subject, and Mobile Number are required.');
      return;
    }

    try {
      await api.put('/teachers/', {
        id: editingTeacher.id,
        name,
        subject,
        phone,
        qualification,
        experience,
        status: statusVal
      });

      // Reset
      setEditingTeacher(null);
      setName('');
      setSubject('');
      setPhone('');
      setQualification('');
      setExperience('');
      setStatusVal('Active');
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update teacher.');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await api.delete(`/teachers/`, { data: { id } });
      fetchTeachers();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const openEditModal = (t) => {
    setEditingTeacher(t);
    setName(t.name);
    setSubject(t.subject);
    setPhone(t.phone);
    setQualification(t.qualification || '');
    setExperience(t.experience || '');
    setStatusVal(t.status || 'Active');
    setError('');
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading teachers roster...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-sans">Teachers Roster</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage academy instructional staff, teaching credentials, and qualifications</p>
        </div>
        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setName('');
            setSubject('');
            setPhone('');
            setQualification('');
            setExperience('');
            setStatusVal('Active');
            setError('');
          }}
          className="px-4 py-2 bg-accent hover:opacity-90 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Teacher</span>
        </button>
      </div>

      {/* Toolbar Search */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search teachers by name or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-850/50 border-b border-gray-150 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Subject Specialty</th>
                <th className="p-4">Mobile Contact</th>
                <th className="p-4">Qualification</th>
                <th className="p-4">Experience</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-xs">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    No teachers registered in workspace roster.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, index) => (
                  <tr key={t.id || index} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/20 transition-all">
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{t.name}</td>
                    <td className="p-4 font-semibold text-accent">{t.subject}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 font-mono">{t.phone}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{t.qualification || 'N/A'}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{t.experience || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${t.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {t.status === 'Active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded cursor-pointer"
                        title="Edit credentials"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(t.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer"
                        title="Remove teacher"
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

      {/* Add Teacher Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Teacher">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold text-center">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Teacher Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Prof. Sarah Conner"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Subject specialty *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="E.g., Physics"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Mobile Contact *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="E.g., 9876543210"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Qualification credentials</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="E.g., M.Sc. in Physics"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Experience Year count</label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="E.g., 5 Years"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Availability Status</label>
              <select
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                className="w-full p-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
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
              Register Teacher
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <Modal isOpen={!!editingTeacher} onClose={() => setEditingTeacher(null)} title={`Edit Teacher - ${editingTeacher.name}`}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold text-center">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Teacher Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., Prof. Sarah Conner"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Subject specialty *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="E.g., Physics"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Mobile Contact *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="E.g., 9876543210"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Qualification credentials</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="E.g., M.Sc. in Physics"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Experience Year count</label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="E.g., 5 Years"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Availability Status</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full p-2.5 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 font-sans">
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-lg text-xs hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:opacity-90 cursor-pointer"
              >
                Update Credentials
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default Teachers;
