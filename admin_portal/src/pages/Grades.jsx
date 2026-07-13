import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Award, Save, Calendar, CheckSquare, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Grades = () => {
  const { role } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Branch states for developers
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Grades & Attendance States
  const [attendance, setAttendance] = useState({});
  const [scores, setScores] = useState({});

  const fetchData = async () => {
    try {
      const exRes = await api.get('/exams/');
      setExams(exRes.data);

      const studRes = await api.get('/students/');
      setStudents(studRes.data);

      if (role === 'developer') {
        const branchRes = await api.get('/developer/centers/');
        setBranches(branchRes.data);
        if (branchRes.data.length > 0) {
          setSelectedBranchId(branchRes.data[0].id.toString());
        }
      } else {
        if (exRes.data.length > 0) {
          setSelectedExamId(exRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  useEffect(() => {
    if (role === 'developer' && selectedBranchId) {
      const branchExams = exams.filter(e => String(e.coaching_center) === String(selectedBranchId));
      if (branchExams.length > 0) {
        setSelectedExamId(branchExams[0].id);
      } else {
        setSelectedExamId('');
      }
    }
  }, [selectedBranchId, exams, role]);

  useEffect(() => {
    if (!selectedExamId) {
      setSelectedExam(null);
      return;
    }
    const exam = exams.find(e => e.id === selectedExamId);
    setSelectedExam(exam);

    if (exam) {
      // Filter batch students
      const batchStudents = students.filter(s => s.batch_ids && s.batch_ids.includes(exam.batch));
      
      // Initialize scores and attendance from exam.marks
      const attMap = {};
      const scoresMap = {};
      
      batchStudents.forEach(s => {
        const existingMark = exam.marks?.find(m => m.student === s.id || m.student_id === s.id);
        if (existingMark) {
          attMap[s.id] = existingMark.attendance !== undefined ? existingMark.attendance : true;
          scoresMap[s.id] = existingMark.obtained_marks !== undefined ? existingMark.obtained_marks : (existingMark.marks_obtained || '');
        } else {
          attMap[s.id] = true;
          scoresMap[s.id] = '';
        }
      });
      
      setAttendance(attMap);
      setScores(scoresMap);
      setError('');
      setSuccess('');
    }
  }, [selectedExamId, exams, students]);

  const handleSaveGrades = async (e) => {
    e.preventDefault();
    if (!selectedExam) return;
    setError('');
    setSuccess('');
    setSaving(true);

    // Validate marks
    const batchStudents = students.filter(s => s.batch_ids && s.batch_ids.includes(selectedExam.batch));
    let validationFailed = false;

    const updatedMarks = batchStudents.map(s => {
      const isPresent = attendance[s.id];
      const scoreStr = scores[s.id];
      const scoreVal = isPresent ? parseFloat(scoreStr || 0) : 0;

      if (isPresent) {
        if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > selectedExam.total_marks) {
          setError(`Invalid marks for ${s.first_name || s.name}. Marks must be between 0 and ${selectedExam.total_marks}.`);
          validationFailed = true;
        }
      }

      return {
        student_id: s.id,
        obtained_marks: scoreVal,
        attendance: isPresent
      };
    });

    if (validationFailed) {
      setSaving(false);
      return;
    }

    try {
      await api.put('/exams/', {
        id: selectedExam.id,
        test_name: selectedExam.test_name,
        standard: selectedExam.standard,
        batch_id: selectedExam.batch,
        subject: selectedExam.subject,
        total_marks: selectedExam.total_marks,
        passing_marks: selectedExam.passing_marks,
        exam_date: selectedExam.exam_date,
        marks: updatedMarks
      });

      setSuccess('Grades Scoreboard updated successfully!');
      // Refresh list to pull updated nested marks
      const exRes = await api.get('/exams/');
      setExams(exRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update grades scorecard.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading grades scoreboard...</span>
      </div>
    );
  }

  const filteredExams = role === 'developer' && selectedBranchId
    ? exams.filter(e => String(e.coaching_center) === String(selectedBranchId))
    : exams;

  const batchStudents = selectedExam ? students.filter(s => s.batch_ids && s.batch_ids.includes(selectedExam.batch)) : [];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Grades Scoreboard</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter marks, track attendance, and log academic evaluations for scheduled tests</p>
      </div>

      {/* Select Test toolbar */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:max-w-2xl">
          {role === 'developer' && (
            <div className="flex items-center space-x-3 w-full sm:w-1/2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Branch:</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full p-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-semibold cursor-pointer"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-3 w-full sm:w-1/2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Choose Test:</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full p-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-semibold cursor-pointer"
            >
              {filteredExams.length === 0 ? (
                <option value="">No tests scheduled</option>
              ) : (
                filteredExams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.test_name} ({ex.batch_name})</option>
                ))
              )}
            </select>
          </div>
        </div>

        {selectedExam && (
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <Calendar size={14} className="mr-1.5 text-accent" />
              <span>Date: <span className="text-gray-900 dark:text-white font-bold">{selectedExam.exam_date}</span></span>
            </div>
            <div className="flex items-center">
              <Award size={14} className="mr-1.5 text-accent" />
              <span>Total Marks: <span className="text-gray-900 dark:text-white font-bold">{selectedExam.total_marks}</span></span>
            </div>
            <div className="flex items-center">
              <CheckSquare size={14} className="mr-1.5 text-accent" />
              <span>Passing: <span className="text-gray-900 dark:text-white font-bold">{selectedExam.passing_marks}</span></span>
            </div>
          </div>
        )}
      </div>

      {selectedExam && (
        <form onSubmit={handleSaveGrades} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center space-x-2">
              <CheckSquare size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Students table */}
          <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-850/50 border-b border-gray-150 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                    <th className="p-4">Student ID</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Attendance</th>
                    <th className="p-4">Marks Obtained (Max: {selectedExam.total_marks})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-xs">
                  {batchStudents.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400">
                        No students enrolled in this batch program.
                      </td>
                    </tr>
                  ) : (
                    batchStudents.map((student, index) => {
                      const isPresent = attendance[student.id] !== false; // defaults to true
                      return (
                        <tr key={student.id || index} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition-all">
                          <td className="p-4 font-bold text-primary dark:text-accent font-mono">{student.student_id}</td>
                          <td className="p-4 font-bold text-gray-900 dark:text-white">{student.first_name || student.name} {student.surname || ''}</td>
                          <td className="p-4">
                            <label className="inline-flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isPresent}
                                onChange={(e) => {
                                  setAttendance({
                                    ...attendance,
                                    [student.id]: e.target.checked
                                  });
                                  if (!e.target.checked) {
                                    setScores({
                                      ...scores,
                                      [student.id]: ''
                                    });
                                  }
                                }}
                                className="rounded border-gray-300 dark:border-gray-700 text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                              />
                              <span className={`text-[10px] font-bold uppercase ${isPresent ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isPresent ? 'Present' : 'Absent'}
                              </span>
                            </label>
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              disabled={!isPresent}
                              value={scores[student.id] !== undefined ? scores[student.id] : ''}
                              onChange={(e) => {
                                setScores({
                                  ...scores,
                                  [student.id]: e.target.value
                                });
                              }}
                              placeholder={isPresent ? "Enter marks score" : "Absent (0)"}
                              min="0"
                              max={selectedExam.total_marks}
                              step="0.5"
                              className="w-48 p-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed font-medium font-sans"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {batchStudents.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-accent hover:opacity-90 disabled:opacity-50 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : 'Save Grades Scorecard'}</span>
                </button>
              </div>
            )}
          </div>
        </form>
      )}

    </div>
  );
};

export default Grades;