import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BookOpen, Calendar, CheckCircle2, AlertCircle, UploadCloud, FileText } from 'lucide-react';
import Modal from '../components/Modal';

const Homework = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);

  // Submission Modal state
  const [selectedHw, setSelectedHw] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [message, setMessage] = useState('');

  const fetchHomework = async () => {
    try {
      // 1. Fetch child profile
      const studRes = await api.get('/students/');
      const activeChild = studRes.data[0];
      setChild(activeChild);

      if (activeChild) {
        // 2. Fetch homework listings
        const hwRes = await api.get('/homework/');
        setHomeworks(hwRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch parent homeworks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!attachmentUrl || !selectedHw || !child) return;
    setSubmitting(true);
    setMessage('');

    try {
      // Append current child's submission to the homework submissions array
      const existingSubmissions = selectedHw.submissions || [];
      const userSubmission = {
        student_id: child.id,
        student_name: child.name,
        attachment_url: attachmentUrl,
        submitted_at: new Date().toISOString().substring(0, 10),
        graded: false,
        marks: 0,
        remarks: ''
      };

      const updatedSubmissions = [
        ...existingSubmissions.filter(s => s.student_id !== child.id),
        userSubmission
      ];

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
      setAttachmentUrl('');
      fetchHomework();
    } catch (err) {
      console.error('Failed to submit homework:', err);
      setMessage('Failed to upload homework submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Syncing child homework trackers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white font-sans">Homework Assignments</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review active assignments, track scorecards, and upload homework sheets</p>
      </div>

      {/* Grid of Homeworks */}
      {homeworks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">No active homework sheets assigned by coaching staff.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeworks.map((hw, index) => {
            // Find child's submission
            const submission = hw.submissions?.find(s => s.student_id === child?.id);
            const isCompleted = !!submission;
            const isGraded = submission?.graded;

            return (
              <div key={hw.id || index} className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                
                <div className="p-5 border-b border-gray-100 dark:border-gray-850">
                  <div className="flex items-start justify-between">
                    <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase">
                      {hw.batch_name}
                    </span>
                    {isCompleted ? (
                      <span className="text-[9px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full uppercase flex items-center space-x-0.5">
                        <CheckCircle2 size={10} />
                        <span>Submitted</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase flex items-center space-x-0.5">
                        <AlertCircle size={10} />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-3 truncate">{hw.title}</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{hw.description}</p>
                </div>

                {/* Body: Timeline & evaluations */}
                <div className="p-5 space-y-3.5 flex-1 text-xs">
                  <div className="flex items-center text-gray-500">
                    <Calendar size={14} className="mr-2 text-accent" />
                    <span>Due Date: <span className="font-bold text-gray-900 dark:text-white">{hw.due}</span></span>
                  </div>

                  {isCompleted && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-850 rounded border border-gray-150 dark:border-gray-800 space-y-1.5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Evaluation Summary</span>
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-500">Scorecard Grades</span>
                        <span className="text-primary dark:text-accent">{isGraded ? `${submission.marks} Marks` : 'Awaiting Grading'}</span>
                      </div>
                      {submission.remarks && (
                        <p className="text-[10px] text-gray-600 dark:text-gray-400 italic">" {submission.remarks} "</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="p-4 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-850 flex justify-end">
                  <button
                    onClick={() => setSelectedHw(hw)}
                    className="px-3.5 py-2 bg-[#14213D] dark:bg-gray-800 hover:opacity-90 text-white rounded text-[10px] font-bold flex items-center space-x-1.5 cursor-pointer transition-all"
                  >
                    <UploadCloud size={12} />
                    <span>{isCompleted ? 'Resubmit Homework' : 'Submit Homework'}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Upload Homework Modal */}
      {selectedHw && (
        <Modal isOpen={!!selectedHw} onClose={() => setSelectedHw(null)} title={`Upload Submission - ${selectedHw.title}`}>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {message && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold text-center">
                {message}
              </div>
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paste a URL reference pointing to your child's scanned homework worksheet PDF file (Google Drive, Dropbox, etc.) to record their submission:
            </p>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Attachment File URL *</label>
              <input
                type="url"
                required
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-mono"
              />
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
                disabled={submitting}
                className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:opacity-90 flex items-center space-x-1.5 cursor-pointer"
              >
                <UploadCloud size={14} />
                <span>{submitting ? 'Submitting...' : 'Upload Worksheet'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default Homework;
