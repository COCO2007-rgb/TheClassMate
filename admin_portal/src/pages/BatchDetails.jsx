import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Users, Award, Trash2, Eye, Edit, X } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';
import Modal from '../components/Modal';

const BatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);
  
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);

  // Selected Exam for Leaderboard
  const [selectedExam, setSelectedExam] = useState(null);

  const fetchDetails = async () => {
    try {
      const batchRes = await api.get(`/batches/${id}/`);
      setBatch(batchRes.data);

      const studRes = await api.get('/students/');
      // Filter students whose batch_ids array contains this batch id
      const filteredStus = studRes.data.filter(s => s.batch_ids && s.batch_ids.includes(id));
      setStudents(filteredStus);

      const examRes = await api.get('/exams/');
      const filteredExams = examRes.data.filter(e => e.batch === id);
      setExams(filteredExams);
      if (filteredExams.length > 0) {
        setSelectedExam(filteredExams[0]);
      }
    } catch (err) {
      console.error('Failed to load batch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading batch details profile...</span>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-sm text-red-500 font-semibold">Error: Batch record not found.</p>
        <button onClick={() => navigate('/batches')} className="px-4 py-2 bg-primary text-white rounded-lg text-xs">Back to Batches</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/batches')}
            className="p-2 rounded-lg bg-white dark:bg-primary border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{batch.name} ({students.length})</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Subject: {batch.subject} • Fee: ₹{batch.fees}/mo</p>
          </div>
        </div>
        
        {/* Share button removed */}
      </div>

      {/* Details sub-navigation tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'students', label: 'Enrolled Students', icon: Users },
          { id: 'leaderboard', label: 'Exam Leaderboard', icon: Award }
        ].map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${isActive ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-355'}`}
            >
              <t.icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-850 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">Active Student Members</h3>
              <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-350 px-2 py-0.5 rounded-full font-semibold">
                {students.length} Students
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-850/50 border-b border-gray-150 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                    <th className="p-4">Student ID</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Student Contact</th>
                    <th className="p-4">Parent Contact</th>
                    <th className="p-4">Joining Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-xs">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">
                        No students enrolled in this batch yet.
                      </td>
                    </tr>
                  ) : (
                    students.map((student, index) => (
                      <tr key={student.id || index} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition-all">
                        <td className="p-4 font-bold text-primary dark:text-accent font-mono">{student.student_id}</td>
                        <td 
                          onClick={() => setSelectedStudentForProfile(student)}
                          className="p-4 font-bold text-gray-900 dark:text-white hover:text-accent cursor-pointer transition-colors"
                        >
                          {student.name} {student.surname || ''}
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-350">{student.student_contact || student.mobile}</td>
                        <td className="p-4 text-gray-600 dark:text-gray-350">{student.parent_contact || 'N/A'}</td>
                        <td className="p-4 text-gray-500 dark:text-gray-400">{student.joining_date || 'N/A'}</td>
                        <td className="p-4">
                          <span className="inline-block text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full uppercase">
                            Active
                          </span>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedStudentForProfile(student)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded cursor-pointer"
                            title="View Student"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => navigate('/students')}
                            className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded cursor-pointer"
                            title="Edit Student"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this student?')) {
                                try {
                                  await api.delete(`/students/${student.id}/`);
                                  fetchDetails();
                                } catch (err) {
                                  console.error('Delete failed:', err);
                                }
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer"
                            title="Delete Student"
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
        )}

        {activeTab === 'leaderboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left exam selector list */}
            <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm h-fit">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Linked Batch Exams</h3>
              <div className="space-y-2">
                {exams.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No exams scheduled for this batch.</p>
                ) : (
                  exams.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => setSelectedExam(ex)}
                      className={`w-full text-left p-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${selectedExam?.id === ex.id ? 'border-accent bg-accent/5 text-gray-900 dark:text-white' : 'border-gray-150 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300'}`}
                    >
                      {ex.name}
                      <span className="block text-[9px] text-gray-400 dark:text-gray-500 mt-1">Date: {ex.date}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right leaderboard renderer */}
            <div className="lg:col-span-2">
              {selectedExam ? (
                <Leaderboard items={selectedExam.marks || []} isAnonymous={false} />
              ) : (
                <div className="p-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center text-xs text-gray-400">
                  Select an exam/test to load scores rankings.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedStudentForProfile(null)} 
          title="Student Profile Details"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-bold">
                {selectedStudentForProfile.name?.charAt(0) || "S"}
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedStudentForProfile.name} {selectedStudentForProfile.surname || ""}
                </h3>
                <p className="text-[10px] text-gray-400 font-mono">ID: {selectedStudentForProfile.student_id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3.5 text-xs text-left">
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Gender</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{selectedStudentForProfile.gender || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Date of Birth</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{selectedStudentForProfile.dob || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Student Contact</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{selectedStudentForProfile.student_contact || selectedStudentForProfile.mobile || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Parent Contact</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{selectedStudentForProfile.parent_contact || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Joining Date</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{selectedStudentForProfile.joining_date || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Status</span>
                <span className="text-emerald-500 font-bold uppercase text-[10px]">Active</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Address</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{selectedStudentForProfile.address || "N/A"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Enrolled Batch</span>
                <span className="font-bold text-accent">{batch.name}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BatchDetails;
