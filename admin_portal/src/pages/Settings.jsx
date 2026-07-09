import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Settings as SettingsIcon, Save, CheckCircle } from 'lucide-react';

const Settings = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [gst, setGst] = useState('');
  const [reportFooter, setReportFooter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/');
      const data = response.data;
      setName(data.name || '');
      setAddress(data.address || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setUpiId(data.upi_id || '');
      setPayeeName(data.payee_name || '');
      setGst(data.gst || '');
      setReportFooter(data.report_footer || '');
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await api.post('/settings/', {
        name,
        address,
        phone,
        email,
        upi_id: upiId,
        payee_name: payeeName,
        gst,
        report_footer: reportFooter
      });
      setMessage('Tuition settings updated successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage('Failed to update tuition settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading tuition settings profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tuition Settings</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure workspace parameters, UPI payee information, and invoice footers</p>
      </div>

      {message && (
        <div className="p-3 bg-accent/15 border border-accent/30 rounded-lg text-xs text-primary dark:text-accent font-semibold text-center">
          {message}
        </div>
      )}

      {/* Settings Form panel */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Institution Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tuition Center Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Apex Coaching Academy"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">GST Identification Number</label>
              <input
                type="text"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                placeholder="E.g., 24AAAAA1111A1Z1"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Public Support Mobile *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="E.g., +91 98765 43210"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Public Support Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E.g., support@apex.com"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Physical Address *</label>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full location street address details..."
              rows="2"
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
            ></textarea>
          </div>

          <hr className="border-gray-100 dark:border-gray-850 my-6" />
          
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Billing Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">UPI Payee ID *</label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="E.g., apexcoaching@okaxis"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Legal Payee Name *</label>
              <input
                type="text"
                required
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="E.g., Apex Academy LLC"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Report Card / Invoice Footer Remarks</label>
            <input
              type="text"
              value={reportFooter}
              onChange={(e) => setReportFooter(e.target.value)}
              placeholder="E.g., Please review and discuss attendance issues with the principal."
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-850">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-accent hover:opacity-90 disabled:opacity-50 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default Settings;
