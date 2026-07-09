import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Award, Trophy, Calendar, Sparkles } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [child, setChild] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      // 1. Fetch child profile
      const studRes = await api.get('/students/');
      const activeChild = studRes.data[0];
      setChild(activeChild);

      if (activeChild) {
        // 2. Fetch exams
        const exRes = await api.get('/exams/');
        setExams(exRes.data);
        if (exRes.data.length > 0) {
          setSelectedExam(exRes.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load parent exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const getChildScore = (ex) => {
    if (!ex || !child) return null;
    return ex.marks?.find(m => m.student_id === child.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Syncing child scoreboard ratings...</span>
      </div>
    );
  }

  const childScore = getChildScore(selectedExam);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white font-sans">Exam Rankings & Scores</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review child's scorecards, percentile marks, and anonymous class performance leaderboards</p>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Exam selector & Personal Performance Card */}
        <div className="space-y-6">
          
          {/* Selector */}
          <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Linked Batch Tests</h3>
            <div className="space-y-2">
              {exams.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No exams scheduled.</p>
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

          {/* Performance scorecard details */}
          {selectedExam && childScore && (
            <div className="bg-primary text-white border border-gray-850 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="text-accent" size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent">Score Card Summary</h4>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-300">Marks Obtained</span>
                  <span className="font-bold">{childScore.score} / {selectedExam.max_marks} marks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Percentile Rank</span>
                  <span className="font-bold text-accent">{childScore.percentage}% percentile</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Exam Code Status</span>
                  <span className="font-mono text-[10px] text-green-400 uppercase font-bold">Graded</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Anonymous Leaderboard */}
        <div className="lg:col-span-2">
          {selectedExam ? (
            <Leaderboard items={selectedExam.marks || []} isAnonymous={true} />
          ) : (
            <div className="p-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center text-xs text-gray-400">
              Select an exam/test to view class percentile rankings.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Exams;
