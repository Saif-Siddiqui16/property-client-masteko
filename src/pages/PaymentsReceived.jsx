import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Eye, RotateCcw, X } from 'lucide-react';
import { Button } from '../components/Button';
import api from '../api/client';
import { hasPermission } from '../utils/permissions';

const PaymentsReceived = () => {
  const [__forceUpdate, __setForceUpdate] = useState(0);
  useEffect(() => {
    const handleUpdate = () => __setForceUpdate(p => p + 1);
    window.addEventListener('permissionsUpdated', handleUpdate);
    return () => window.removeEventListener('permissionsUpdated', handleUpdate);
  }, []);

  const [payments, setPayments] = useState([]);
  if (!hasPermission('Payments Received', 'view')) return null;


  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/api/admin/payments');
      setPayments(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleRefund = async (payment) => {
    const reason = window.prompt(`Enter reason for refunding ${payment.id}:`, 'Security Deposit Refund');
    if (!reason) return;

    try {
      await api.post('/api/admin/refunds', {
        type: 'Refund',
        reason: reason,
        tenantId: payment.tenantId,
        unitId: payment.unitId,
        amount: payment.amount,
        status: 'Completed',
        date: new Date()
      });
      alert('Refund recorded successfully');
    } catch (error) {
      console.error('Refund failed:', error);
      alert('Failed to record refund');
    }
  };

  const [selectedPayment, setSelectedPayment] = useState(null);

  return (
    <MainLayout title="Payments Received">
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
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Amount</th>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Method</th>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Date</th>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Status</th>
                  <th className="p-4 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Action</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 border-b border-gray-100 text-sm text-slate-700 font-mono whitespace-nowrap">{p.id}</td>
                    <td className="p-4 border-b border-gray-100 text-sm text-slate-700 whitespace-nowrap">{p.tenant}</td>
                    <td className="p-4 border-b border-gray-100 text-sm text-slate-700 whitespace-nowrap">{p.unit}</td>
                    <td className="p-4 border-b border-gray-100 text-sm font-medium font-mono whitespace-nowrap">${p.amount.toLocaleString('en-CA')}</td>
                    <td className="p-4 border-b border-gray-100 text-sm text-slate-700 whitespace-nowrap">{p.method}</td>
                    <td className="p-4 border-b border-gray-100 text-sm text-slate-700 whitespace-nowrap">{p.date}</td>
                    <td className="p-4 border-b border-gray-100 text-sm">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-100 whitespace-nowrap">{p.status}</span>
                    </td>
                    <td className="p-4 border-b border-gray-100 text-sm">
                      <div className="flex gap-2 whitespace-nowrap">
                        <button onClick={() => setSelectedPayment(p)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-md transition-colors">
                          <Eye size={16} />
                        </button>
                        {hasPermission('Refunds', 'add') && (
                          <button
                            onClick={() => handleRefund(p)}
                            title="Refund"
                            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <RotateCcw size={16} />
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

        {/* VIEW PAYMENT MODAL */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white p-6 rounded-xl w-[520px] shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Payment Details</h3>
                <button onClick={() => setSelectedPayment(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Invoice No</label><span className="text-sm font-medium text-slate-900">{selectedPayment.id}</span></div>
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Tenant</label><span className="text-sm font-medium text-slate-900">{selectedPayment.tenant}</span></div>
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Unit</label><span className="text-sm font-medium text-slate-900">{selectedPayment.unit}</span></div>
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Lease Type</label><span className="text-sm font-medium text-slate-900">{selectedPayment.type}</span></div>
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Payment Method</label><span className="text-sm font-medium text-slate-900">{selectedPayment.method}</span></div>
                <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Paid On</label><span className="text-sm font-medium text-slate-900">{selectedPayment.date}</span></div>

                <div className="col-span-2 mt-2 p-4 rounded-lg bg-emerald-50 text-center text-xl font-bold text-emerald-800 border border-emerald-100">
                  ${selectedPayment.amount.toLocaleString('en-CA')}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setSelectedPayment(null)}>
                  Close
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      // selectedPayment.id is invoiceNo in this view (based on getReceivedPayments mapping)
                      const res = await api.get(`/api/admin/payments/${selectedPayment.id}/download`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `receipt-${selectedPayment.id}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    } catch (e) { alert('Download failed'); }
                  }}
                >
                  Download Receipt
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default PaymentsReceived;
