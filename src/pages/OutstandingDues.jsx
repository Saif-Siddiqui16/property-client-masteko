import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Eye, CreditCard, X } from 'lucide-react';
import { Button } from '../components/Button';
import api from '../api/client';
import { hasPermission } from '../utils/permissions';

const OutstandingDues = () => {
  const [__forceUpdate, __setForceUpdate] = useState(0);
  useEffect(() => {
    const handleUpdate = () => __setForceUpdate(p => p + 1);
    window.addEventListener('permissionsUpdated', handleUpdate);
    return () => window.removeEventListener('permissionsUpdated', handleUpdate);
  }, []);

  const [dues, setDues] = useState([]);
  if (!hasPermission('Outstanding Dues', 'view')) return null;


  useEffect(() => {
    fetchDues();
  }, []);

  const fetchDues = async () => {
    try {
      const response = await api.get('/api/admin/outstanding-dues');
      setDues(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching outstanding dues:', error);
    }
  };

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'Cash' });

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentForm.amount) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await api.post('/api/admin/payments', {
        invoiceId: selectedInvoice.id,
        amount: paymentForm.amount,
        paymentMethod: paymentForm.paymentMethod
      });
      alert('Payment recorded successfully');
      setShowPaymentModal(false);
      setSelectedInvoice(null); // Force refresh of selected state
      setPaymentForm({ amount: '', paymentMethod: 'Cash' });
      fetchDues();

    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    }
  };

  return (
    <MainLayout title="Outstanding Dues">
      <div className="p-0">

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Invoice</th>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Tenant</th>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Unit</th>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Lease Type</th>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Amount</th>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Due Date</th>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Status</th>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Action</th>
                </tr>
              </thead>

              <tbody>
                {dues.map((d) => (
                  <tr key={d.invoice} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 border-b border-gray-100 text-sm text-slate-700 font-mono whitespace-nowrap">{d.invoice}</td>
                    <td className="p-4 border-b border-gray-100 text-sm text-slate-700 whitespace-nowrap">{d.tenant}</td>
                    <td className="p-4 border-b border-gray-100 text-sm text-slate-700 whitespace-nowrap">{d.unit}</td>
                    <td className="p-4 border-b border-gray-100 text-sm text-slate-700 whitespace-nowrap">{d.leaseType}</td>
                    <td className="p-4 border-b border-gray-100 text-sm font-medium font-mono text-slate-700 whitespace-nowrap">${d.amount.toLocaleString('en-CA')}</td>
                    <td className="p-4 border-b border-gray-100 text-sm text-slate-700 whitespace-nowrap">{d.dueDate}</td>
                    <td className="p-4 border-b border-gray-100 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${d.status === 'Overdue'
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : d.status === 'Partial'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>
                        {d.status}
                        {d.daysOverdue > 0 && d.status !== 'Partial' && ` (${d.daysOverdue} days)`}
                      </span>

                    </td>
                    <td className="p-4 border-b border-gray-100 text-sm">
                      <div className="flex gap-2 whitespace-nowrap">
                        <button onClick={() => setSelectedInvoice(d)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-md transition-colors">
                          <Eye size={16} />
                        </button>
                        {hasPermission('Outstanding Dues', 'add') && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(d);
                              setPaymentForm({ amount: d.amount.toString(), paymentMethod: 'Cash' });
                              setShowPaymentModal(true);
                            }}
                            title="Record Payment"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <CreditCard size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VIEW INVOICE MODAL */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white p-6 rounded-xl w-[520px] shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Outstanding Invoice</h3>
                <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Invoice</label><span className="text-sm font-medium text-slate-900">{selectedInvoice.invoice}</span></div>
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Tenant</label><span className="text-sm font-medium text-slate-900">{selectedInvoice.tenant}</span></div>
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Unit</label><span className="text-sm font-medium text-slate-900">{selectedInvoice.unit}</span></div>
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Lease Type</label><span className="text-sm font-medium text-slate-900">{selectedInvoice.leaseType}</span></div>
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Due Date</label><span className="text-sm font-medium text-slate-900">{selectedInvoice.dueDate}</span></div>
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Status</label><span className="text-sm font-medium text-slate-900">{selectedInvoice.status}</span></div>

                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Total Amount</label><span className="text-sm font-medium text-slate-900">${selectedInvoice.totalAmount?.toLocaleString('en-CA')}</span></div>
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Already Paid</label><span className="text-sm font-medium text-emerald-600">-${selectedInvoice.paidAmount?.toLocaleString('en-CA')}</span></div>

                <div className="col-span-2 mt-2 p-4 rounded-lg bg-red-50 text-center text-xl font-bold text-red-800 border border-red-100">
                  ${selectedInvoice.amount.toLocaleString('en-CA')} Remaining Due
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>
                  Close
                </Button>
                {hasPermission('Outstanding Dues', 'add') && (
                  <Button onClick={() => {
                    setPaymentForm({ amount: selectedInvoice.amount.toString(), paymentMethod: 'Cash' });
                    setShowPaymentModal(true);
                  }}>
                    Record Payment
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RECORD PAYMENT MODAL */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white p-6 rounded-xl w-[420px] shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Record Payment</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4 space-y-1">
                <p className="text-sm text-slate-600">Invoice: <span className="font-mono font-semibold text-slate-900">{selectedInvoice.invoice}</span></p>
                <p className="text-sm text-slate-600">Tenant: <span className="font-semibold text-slate-900">{selectedInvoice.tenant}</span></p>
                <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-50">
                  <span>Total: ${selectedInvoice.totalAmount?.toLocaleString('en-CA')}</span>
                  <span>Paid: ${selectedInvoice.paidAmount?.toLocaleString('en-CA')}</span>
                </div>
                <p className="text-sm font-bold text-slate-700 pt-1">Remaining: <span className="text-red-600">${selectedInvoice.amount.toLocaleString('en-CA')}</span></p>
              </div>


              <div className="space-y-4 mb-6">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount ($)</span>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all font-medium text-slate-900"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Method</span>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all font-medium text-slate-900 bg-white"
                  >
                    <option>Cash</option>
                    <option>Check</option>
                    <option>Bank Transfer</option>
                    <option>Credit Card</option>
                    <option>Debit Card</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRecordPayment}>
                  Confirm Payment
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default OutstandingDues;
