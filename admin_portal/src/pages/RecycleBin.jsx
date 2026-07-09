import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Trash2, RotateCcw, AlertOctagon } from 'lucide-react';

const RecycleBin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchDeleted = async () => {
    try {
      const response = await api.get('/recycle/bin/');
      setItems(response.data);
    } catch (err) {
      console.error('Failed to load recycle bin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (itemId, type) => {
    setMessage('');
    try {
      await api.post('/recycle/restore/', { item_id: itemId, type });
      setMessage(`Successfully restored ${type}!`);
      fetchDeleted();
    } catch (err) {
      console.error('Failed to restore:', err);
      setMessage('Restore failed.');
    }
  };

  const handlePurge = async (itemId, type) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${type}? This action CANNOT be undone.`)) return;
    setMessage('');
    try {
      await api.post('/recycle/purge/', { item_id: itemId, type });
      setMessage(`Permanently deleted ${type}.`);
      fetchDeleted();
    } catch (err) {
      console.error('Failed to purge:', err);
      setMessage('Permanent delete failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading deleted database collections...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recycle Bin</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review deleted student directories and classes, restore items or permanently purge them</p>
      </div>

      {message && (
        <div className="p-3 bg-accent/15 border border-accent/30 rounded-lg text-xs text-primary dark:text-accent font-semibold text-center">
          {message}
        </div>
      )}

      {/* Grid of deleted items */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-850 flex items-center space-x-2">
          <AlertOctagon size={16} className="text-accent" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Deleted Archives</h3>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-850">
          {items.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              The recycle bin is empty. No deleted archives in workspace database.
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.id || index} className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-all text-xs">
                <div>
                  <span className="font-bold text-gray-950 dark:text-white">{item.name}</span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Type: <span className="font-semibold uppercase text-accent">{item.type}</span> • Archived: {item.deleted_at}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRestore(item.item_id, item.type)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => handlePurge(item.item_id, item.type)}
                    className="px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg hover:opacity-90 inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Purge</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default RecycleBin;
