import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Layers, Users, CalendarDays, CreditCard, BookOpen, FileSpreadsheet, Activity, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commandItems = [
    { name: 'Go to Dashboard', path: '/', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'Go to Batches', path: '/batches', icon: Layers, category: 'Navigation' },
    { name: 'Go to Teachers Directory', path: '/teachers', icon: Users, category: 'Navigation' },
    { name: 'Go to Students Directory', path: '/students', icon: Users, category: 'Navigation' },
    { name: 'Go to Attendance Matrix', path: '/attendance', icon: CalendarDays, category: 'Navigation' },
    { name: 'Go to Fees & Ledgers', path: '/fees', icon: CreditCard, category: 'Navigation' },
    { name: 'Go to Homework Tasks', path: '/homework', icon: BookOpen, category: 'Navigation' },
    { name: 'Go to Exam Grades', path: '/exams', icon: FileSpreadsheet, category: 'Navigation' },
    { name: 'Go to Audit Logs', path: '/audit-logs', icon: Activity, category: 'Management' },
    { name: 'Go to Recycle Bin', path: '/recycle-bin', icon: Trash2, category: 'Management' },
  ];

  const filteredItems = commandItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl bg-white dark:bg-primary border border-gray-150 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden glass-panel z-10"
        >
          {/* Search Header */}
          <div className="flex items-center space-x-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-850">
            <Search size={18} className="text-gray-400 dark:text-accent" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search navigation routes and actions..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
              className="w-full bg-transparent border-0 outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
            />
            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 font-bold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">ESC</span>
          </div>

          {/* Results List */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No routes or commands matched your query.
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.name}
                    onClick={() => { navigate(item.path); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-accent/15 dark:bg-accent/20 text-accent font-semibold'
                        : 'text-gray-750 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={16} className={isSelected ? 'text-accent' : 'text-gray-400'} />
                      <span className="text-xs">{item.name}</span>
                    </div>
                    {isSelected && (
                      <div className="flex items-center space-x-1.5 text-[10px] font-bold">
                        <span>Go</span>
                        <ArrowRight size={10} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Footer Guide */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-850 flex items-center justify-between text-[9px] text-gray-400 font-medium">
            <div className="flex space-x-3">
              <span>↑↓ Navigation</span>
              <span>↵ Enter to select</span>
            </div>
            <span>Type to filter...</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CommandPalette;
