import React from 'react';
import { Trophy, Award } from 'lucide-react';

const Leaderboard = ({ items = [], isAnonymous = true }) => {
  // Sort items descending by score
  const sorted = [...items].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-primary text-white flex items-center justify-between border-b border-gray-850">
        <div className="flex items-center space-x-2">
          <Trophy size={18} className="text-accent" />
          <h3 className="font-bold text-sm">Class Performance Rankings</h3>
        </div>
        <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">
          {sorted.length} Entries
        </span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-850">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No grading entries scheduled.
          </div>
        ) : (
          sorted.map((item, index) => {
            const rank = index + 1;
            
            return (
              <div
                key={item.student_id || index}
                className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-all text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 flex justify-center">
                    {rank === 1 ? (
                      <Trophy size={18} className="text-accent fill-accent" />
                    ) : rank === 2 ? (
                      <Award size={18} className="text-gray-400 fill-gray-400" />
                    ) : rank === 3 ? (
                      <Award size={18} className="text-amber-700 fill-amber-700" />
                    ) : (
                      <span className="text-xs font-semibold text-gray-500">
                        #{rank}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      {isAnonymous ? `STU-XXXX${String(item.student_id).slice(-4)}` : item.student_name || item.student_id}
                    </h4>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-primary dark:text-white bg-gray-150 dark:bg-gray-800 px-2 py-1 rounded">
                    {item.score} Marks
                  </span>
                  {item.percentage && (
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">
                      {item.percentage}% Percentile
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
