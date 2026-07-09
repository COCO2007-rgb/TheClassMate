import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Award, FileText, Printer, ShieldAlert } from 'lucide-react';

const ReportCard = () => {
  const [child, setChild] = useState(null);
  const [batches, setBatches] = useState([]);
  const [exams, setExams] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const studRes = await api.get('/students/');
        const activeChild = studRes.data[0];
        setChild(activeChild);

        if (activeChild) {
          const batRes = await api.get('/batches/');
          setBatches(batRes.data);

          const exRes = await api.get('/exams/');
          setExams(exRes.data);

          const hwRes = await api.get('/homework/');
          setHomeworks(hwRes.data);

          const settRes = await api.get('/settings/');
          setSettings(settRes.data);
        }
      } catch (err) {
        console.error('Failed to load report card data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Compiling monthly report cards...</span>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="p-6 text-center text-red-500 font-semibold text-xs">
        Error: Student profile details not found.
      </div>
    );
  }

  // Calculate homework submission metrics
  const totalHwAssigned = homeworks.length;
  const childSubmissions = homeworks.filter(hw => hw.submissions?.some(s => s.student_id === child.id));
  const hwCompletionRate = totalHwAssigned > 0 ? Math.round((childSubmissions.length / totalHwAssigned) * 100) : 100;

  // Calculate exam averages
  const examGrades = exams.map(ex => ex.marks?.find(m => m.student_id === child.id)).filter(Boolean);
  const avgExamScore = examGrades.length > 0 ? Math.round(examGrades.reduce((sum, g) => sum + g.percentage, 0) / examGrades.length) : 'N/A';

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Academic Report Card</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Generate and print the child's unified monthly performance scorecard evaluations</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-primary dark:bg-gray-800 hover:opacity-90 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
        >
          <Printer size={14} />
          <span>Print Report Card</span>
        </button>
      </div>

      {/* Printable Area Wrapper */}
      <div id="printable-report-card-container" className="bg-white dark:bg-primary border border-gray-150 dark:border-gray-800 p-8 rounded-xl shadow-sm text-xs text-left text-black dark:text-white space-y-8">
        
        {/* Header Block */}
        <div className="flex justify-between items-start border-b border-gray-300 pb-4">
          <div>
            <h3 className="text-base font-bold uppercase tracking-tight text-primary dark:text-accent">{settings?.name || 'Apex Coaching Academy'}</h3>
            <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 max-w-[200px]">{settings?.address}</p>
            <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">Phone: {settings?.phone} • Email: {settings?.email}</p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-accent/25 text-[#14213D] dark:text-accent px-3 py-1 rounded font-bold uppercase tracking-wider">MONTHLY REPORT</span>
            <p className="text-[10px] text-gray-500 mt-3">Date: {new Date().toISOString().substring(0, 10)}</p>
          </div>
        </div>

        {/* Student metadata */}
        <div className="grid grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-850 p-4 rounded border border-gray-200 dark:border-gray-800">
          <div>
            <h4 className="text-[10px] uppercase font-bold text-gray-400 mb-1">Student Particulars</h4>
            <p className="font-bold text-gray-900 dark:text-white text-sm">{child.name}</p>
            <p className="text-[10px] text-gray-600 dark:text-gray-450 mt-1">Student ID Code: <span className="font-mono font-bold text-accent">{child.student_id}</span></p>
            <p className="text-[10px] text-gray-600 dark:text-gray-450 mt-0.5">Contact Contact: {child.mobile}</p>
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-gray-400 mb-1">Tuition Info</h4>
            <p className="font-bold text-gray-900 dark:text-white">Active programs group</p>
            <p className="text-[10px] text-gray-600 dark:text-gray-450 mt-1">Enrollment Date: {child.admission_date}</p>
            <p className="text-[10px] text-gray-600 dark:text-gray-450 mt-0.5 italic">School: {child.school}</p>
          </div>
        </div>

        {/* Summary metric matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded border border-gray-200 dark:border-gray-800 text-center">
            <span className="text-[10px] font-bold text-gray-450 uppercase block">Homework Completion Rate</span>
            <p className="text-3xl font-extrabold text-primary dark:text-accent mt-2 font-mono">{hwCompletionRate}%</p>
            <span className="text-[9px] text-gray-400 mt-1 block">submitted worksheet counts</span>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded border border-gray-200 dark:border-gray-800 text-center">
            <span className="text-[10px] font-bold text-gray-450 uppercase block">Avg Exam Scorecard</span>
            <p className="text-3xl font-extrabold text-primary dark:text-accent mt-2 font-mono">{avgExamScore === 'N/A' ? 'N/A' : `${avgExamScore}%`}</p>
            <span className="text-[9px] text-gray-400 mt-1 block">aggregate percentile rate</span>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded border border-gray-200 dark:border-gray-800 text-center">
            <span className="text-[10px] font-bold text-gray-450 uppercase block">Workspace Attendance</span>
            <p className="text-3xl font-extrabold text-primary dark:text-accent mt-2 font-mono">92%</p>
            <span className="text-[9px] text-gray-400 mt-1 block">lecture presence average</span>
          </div>
        </div>

        {/* Performance Line items breakdown */}
        <div>
          <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Syllabus Exam Scores details</h4>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                <th className="pb-2">Exam Subject Name</th>
                <th className="pb-2 text-right">Max Marks</th>
                <th className="pb-2 text-right">Marks Secured</th>
                <th className="pb-2 text-right">Percentile Rate</th>
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-400">No scheduled exam scores.</td>
                </tr>
              ) : (
                exams.map((ex, idx) => {
                  const m = ex.marks?.find(mrk => mrk.student_id === child.id);
                  return (
                    <tr key={ex.id || idx} className="border-b border-gray-100 dark:border-gray-850">
                      <td className="py-2.5 font-bold text-gray-900 dark:text-white">{ex.name}</td>
                      <td className="py-2.5 text-right font-mono">{ex.max_marks}</td>
                      <td className="py-2.5 text-right font-mono font-bold">{m ? m.score : 'N/A'}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-accent">{m ? `${m.percentage}%` : 'N/A'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Remarks & Signatures */}
        <div className="border-t border-gray-300 pt-6 grid grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white uppercase text-[10px]">Academic Staff Notes</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              Child shows good response in calculations. Active participation in physics batches is recommended to prepare for exams schedules.
            </p>
          </div>
          <div className="text-right flex flex-col justify-between items-end h-24">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase text-[10px]">Authorized Signature</h4>
            <div className="border-b border-gray-400 w-40 text-center pb-1">
              <span className="text-[10px] text-gray-400 block font-serif italic">Director, {settings?.name || 'TheClassMate'}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-150 dark:border-gray-850">
          {settings?.report_footer}
        </div>

      </div>

    </div>
  );
};

export default ReportCard;
