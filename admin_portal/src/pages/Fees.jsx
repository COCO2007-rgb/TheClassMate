import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CreditCard, Plus, Receipt, Landmark, Filter, Printer, Download, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';

const Fees = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');

  // Collect Fee Modal state
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [month, setMonth] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');

  // Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchData = async () => {
    try {
      const payRes = await api.get('/fees/payments/');
      setPayments(payRes.data);

      const studRes = await api.get('/students/');
      setStudents(studRes.data);

      const batRes = await api.get('/batches/');
      setBatches(batRes.data);

      const settRes = await api.get('/settings/');
      setSettings(settRes.data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCollectFee = async (e) => {
    e.preventDefault();
    setError('');

    if (!studentId || !amount || !month) {
      setError('Student ID, amount, and fee month are required.');
      return;
    }

    const selectedStu = students.find(s => s.id === studentId);
    if (!selectedStu) {
      setError('Selected student record invalid.');
      return;
    }

    try {
      await api.post('/fees/payments/', {
        student_id: studentId,
        student_name: selectedStu.name,
        student_code: selectedStu.student_id,
        amount: parseFloat(amount),
        method,
        month,
        transaction_id: transactionId || 'MOCK-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toISOString().substring(0, 10)
      });

      setStudentId('');
      setAmount('');
      setMethod('UPI');
      setMonth('');
      setTransactionId('');
      setIsCollectModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    return p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
           p.receipt_id?.toLowerCase().includes(search.toLowerCase()) ||
           p.student_code?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Loading billing ledgers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fees & Ledgers</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review ledger logs, invoice students, and generate printable receipts</p>
        </div>
        <button
          onClick={() => setIsCollectModalOpen(true)}
          className="px-4 py-2 bg-accent hover:opacity-90 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Collect Fee Payment</span>
        </button>
      </div>

      {/* Toolbar filter */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Filter size={14} />
          </span>
          <input
            type="text"
            placeholder="Search payments by student name, ID or receipt ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Showing {filteredPayments.length} logged payments
        </div>
      </div>

      {/* Billing Ledger Table */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-850/50 border-b border-gray-150 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                <th className="p-4">Receipt ID</th>
                <th className="p-4">Student ID</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Billing Month</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Amount Paid</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-xs">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    No payment logs matching search.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, index) => (
                  <tr key={p.id || index} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition-all">
                    <td className="p-4 font-mono font-bold text-primary dark:text-accent">{p.receipt_id}</td>
                    <td className="p-4 font-mono text-gray-600 dark:text-gray-300">{p.student_code}</td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{p.student_name}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-350">{p.month}</td>
                    <td className="p-4">
                      <span className="bg-primary/5 dark:bg-white/10 text-primary dark:text-white px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                        {p.method}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">₹{p.amount}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{p.date}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="px-2.5 py-1.5 bg-[#E5E5E5] text-primary dark:bg-gray-800 dark:text-white hover:bg-accent hover:text-primary rounded text-[10px] font-bold inline-flex items-center space-x-1 cursor-pointer transition-all"
                      >
                        <Receipt size={11} />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Fee payment Modal */}
      <Modal isOpen={isCollectModalOpen} onClose={() => setIsCollectModalOpen(false)} title="Record Fee Payment">
        <form onSubmit={handleCollectFee} className="space-y-4">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold text-center">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Select Student *</label>
            <select
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
            >
              <option value="">Choose Student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Billing Month *</label>
              <input
                type="month"
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Amount Paid (₹) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="E.g., 120"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="NetBanking">Net Banking</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Transaction Ref ID</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="E.g., Txn-998822"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => setIsCollectModalOpen(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-lg text-xs hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:opacity-90 cursor-pointer"
            >
              Commit Ledger
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Invoice Modal */}
      {selectedReceipt && (
        <Modal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} title="Print Transaction Invoice">
          <div id="printable-receipt-container" className="p-4 space-y-6 text-left text-xs bg-white text-black border border-gray-200 rounded-lg max-h-[85vh] overflow-y-auto">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-gray-300 pb-4">
              <div>
                <h3 className="text-base font-bold uppercase tracking-tight text-primary">{settings?.name || 'Apex Coaching Academy'}</h3>
                <p className="text-[10px] text-gray-600 mt-1 max-w-[200px]">{settings?.address}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Phone: {settings?.phone} • Email: {settings?.email}</p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold uppercase">PAID INVOICE</span>
                <p className="text-[10px] text-gray-500 mt-2">Receipt: <span className="font-mono font-bold">{selectedReceipt.receipt_id}</span></p>
                <p className="text-[10px] text-gray-500 mt-0.5">Date: {selectedReceipt.date}</p>
              </div>
            </div>

            {/* Billing Details Metadata */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-150">
              <div>
                <h4 className="text-[10px] uppercase font-bold text-gray-400 mb-1">Student Details</h4>
                <p className="font-bold text-gray-900">{selectedReceipt.student_name}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">ID: {selectedReceipt.student_code}</p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold text-gray-400 mb-1">Payment Method Details</h4>
                <p className="font-bold text-gray-900">{selectedReceipt.method}</p>
                <p className="text-[10px] text-gray-600 mt-0.5 font-mono">Txn Ref: {selectedReceipt.transaction_id}</p>
              </div>
            </div>

            {/* Table Line Item breakdown */}
            <table className="w-full text-left border-collapse mt-4">
              <thead>
                <tr className="border-b border-gray-300 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <th className="pb-2">Fee Description</th>
                  <th className="pb-2 text-right">Fee Period</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5">Tuition Class Enrollment Fees</td>
                  <td className="py-2.5 text-right font-semibold">{selectedReceipt.month}</td>
                  <td className="py-2.5 text-right font-bold">₹{selectedReceipt.amount}</td>
                </tr>
                <tr>
                  <td colSpan="2" className="pt-4 text-right font-semibold text-gray-600">Total Tax (GST Exempt):</td>
                  <td className="pt-4 text-right font-bold">₹0.00</td>
                </tr>
                <tr className="border-t border-gray-300">
                  <td colSpan="2" className="py-2 text-right font-bold text-gray-900 text-sm">Grand Paid Total:</td>
                  <td className="py-2 text-right font-bold text-primary text-sm">₹{selectedReceipt.amount}</td>
                </tr>
              </tbody>
            </table>

            {/* Terms / Footer details */}
            <div className="border-t border-gray-300 pt-4 text-[9px] text-gray-500 space-y-1">
              <p>1. This is a computer generated receipt, signature is not required.</p>
              <p>2. Payment for {selectedReceipt.month} month is non-refundable.</p>
              <p className="italic font-semibold text-center mt-2 text-primary">{settings?.report_footer}</p>
            </div>

            {/* Floating print actions */}
            <div className="flex justify-end space-x-2 pt-6 border-t border-gray-150">
              <button
                onClick={handlePrintReceipt}
                className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:opacity-90 inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Fees;
