import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CreditCard, Landmark, Receipt, ChevronRight, Printer, CheckCircle, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import Modal from '../components/Modal';

const Fees = () => {
  const [payments, setPayments] = useState([]);
  const [child, setChild] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pay Fees Modal states
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const qrCanvasRef = React.useRef(null);

  // Invoice / Receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchData = async () => {
    try {
      const studRes = await api.get('/students/');
      const activeChild = studRes.data[0];
      setChild(activeChild);

      if (activeChild) {
        const payRes = await api.get('/fees/payments/');
        setPayments(payRes.data);
      }

      const settRes = await api.get('/settings/');
      setSettings(settRes.data);
    } catch (err) {
      console.error('Failed to load parent payments ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generate UPI QR Code when Pay Modal is opened
  useEffect(() => {
    if (isPayModalOpen && qrCanvasRef.current && settings?.upi_id && amount) {
      // Build standard UPI intent URL: upi://pay?pa=id&pn=name&am=amount&cu=USD
      const upiUrl = `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.payee_name || settings.name)}&am=${amount}&cu=INR`;
      QRCode.toCanvas(
        qrCanvasRef.current,
        upiUrl,
        {
          width: 160,
          margin: 1,
          color: {
            dark: '#14213D',
            light: '#FFFFFF'
          }
        },
        (error) => {
          if (error) console.error('Error generating UPI QR code:', error);
        }
      );
    }
  }, [isPayModalOpen, amount, settings]);

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || !month || !transactionId) {
      setError('Amount, fee month, and Transaction ID references are required.');
      return;
    }

    setPaying(true);
    try {
      await api.post('/fees/payments/', {
        student_id: child.id,
        student_name: child.name,
        student_code: child.student_id,
        amount: parseFloat(amount),
        method: 'UPI',
        month: month,
        transaction_id: transactionId,
        date: new Date().toISOString().substring(0, 10)
      });

      setAmount('');
      setMonth('');
      setTransactionId('');
      setIsPayModalOpen(false);
      fetchData();
      alert('Fee payment recorded successfully! Check billing ledgers.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit payment.');
    } finally {
      setPaying(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <span className="text-xs font-semibold text-gray-500 animate-pulse">Syncing child billing ledgers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fees & Payments</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review ledger logs, download transaction receipts, and settle outstanding balances</p>
        </div>
        <button
          onClick={() => setIsPayModalOpen(true)}
          className="px-4 py-2 bg-accent hover:opacity-90 text-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Smartphone size={16} />
          <span>Pay Outstanding Fees</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-primary border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-850 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Billing Payments Ledger</h3>
          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-350 px-2 py-0.5 rounded-full font-semibold">
            {payments.length} Payments Collected
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-850/50 border-b border-gray-150 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                <th className="p-4">Receipt ID</th>
                <th className="p-4">Fee Month</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Reference Txn ID</th>
                <th className="p-4">Amount Paid</th>
                <th className="p-4">Paid Date</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-xs">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    No payment logs registered for this child profile.
                  </td>
                </tr>
              ) : (
                payments.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition-all">
                    <td className="p-4 font-mono font-bold text-primary dark:text-accent">{p.receipt_id}</td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{p.month}</td>
                    <td className="p-4 font-semibold uppercase">{p.method}</td>
                    <td className="p-4 font-mono text-gray-500">{p.transaction_id}</td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">₹{p.amount}</td>
                    <td className="p-4 text-gray-500">{p.date}</td>
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

      {/* UPI QR Payment Modal */}
      {isPayModalOpen && (
        <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="UPI Payment Gateway">
          <form onSubmit={handlePaySubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold text-center">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Fee Month *</label>
                <input
                  type="month"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="E.g., 120"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-medium"
                />
              </div>
            </div>

            {/* Render dynamically QR code only if amount and upi ID are set */}
            {settings?.upi_id && amount && (
              <div className="flex flex-col items-center border border-dashed border-gray-200 dark:border-gray-850 p-4 rounded bg-gray-50 dark:bg-gray-850">
                <canvas ref={qrCanvasRef}></canvas>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 font-bold font-mono">
                  UPI Payee: {settings.upi_id}
                </span>
                <p className="text-[9px] text-gray-400 mt-0.5">Payee Legal Name: {settings.payee_name}</p>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Transaction Ref / UTR ID *</label>
              <input
                type="text"
                required
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter 12-digit transaction ID number"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-accent text-gray-900 dark:text-white font-mono"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-150 dark:border-gray-850">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-lg text-xs hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paying}
                className="px-4 py-2 bg-accent text-primary font-bold rounded-lg text-xs hover:opacity-90 flex items-center space-x-1 cursor-pointer"
              >
                <CheckCircle size={14} />
                <span>{paying ? 'Verifying...' : 'Settle Payment'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <Modal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} title="Print Transaction Invoice">
          <div id="printable-receipt-container" className="p-4 space-y-6 text-left text-xs bg-white text-black border border-gray-200 rounded-lg max-h-[85vh] overflow-y-auto">
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

            <div className="border-t border-gray-300 pt-4 text-[9px] text-gray-500 space-y-1">
              <p>1. This is a computer generated receipt, signature is not required.</p>
              <p>2. Payment for {selectedReceipt.month} month is non-refundable.</p>
              <p className="italic font-semibold text-center mt-2 text-primary">{settings?.report_footer}</p>
            </div>

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
