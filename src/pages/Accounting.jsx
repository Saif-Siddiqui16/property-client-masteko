import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { PaymentModal } from '../components/PaymentModal';
import { Download, Filter, Plus, DollarSign } from 'lucide-react';

const MOCK_TRANSACTIONS = [
    { id: 1, date: '2024-01-01', description: 'Rent - Jan 2024', type: 'Invoice', amount: 1200.00, balance: 1200.00, status: 'Unpaid' },
    { id: 2, date: '2024-01-05', description: 'Payment from Alice', type: 'Payment', amount: -1000.00, balance: 200.00, status: 'Partial' },
    { id: 3, date: '2024-02-01', description: 'Rent - Feb 2024', type: 'Invoice', amount: 1200.00, balance: 1400.00, status: 'Unpaid' },
];

import api from '../api/client';

export const Accounting = () => {
    const [transactions, setTransactions] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    React.useEffect(() => {
        fetchTxs();
    }, []);

    const fetchTxs = async () => {
        try {
            const res = await api.get('/api/admin/accounting/transactions');
            setTransactions(res.data);
        } catch (e) { console.error(e); }
    };

    // Calculate simple stats locally for now
    const totalReceivables = transactions.filter(t => t.type === 'Invoice').reduce((acc, t) => acc + t.balance, 0);
    const ytdIncome = transactions.filter(t => t.type === 'Payment').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);

    return (
        <DashboardLayout title="Accounting & Ledger">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <Button variant="outline" icon={Filter}>Filter</Button>
                    <Button variant="outline" icon={Download}>Export QuickBooks</Button>
                </div>
                {/* Simplified Record Transaction for demo - usually a modal */}
                <Button icon={Plus} onClick={async () => {
                    const desc = prompt("Transaction Description:");
                    if (!desc) return;
                    const amount = parseFloat(prompt("Amount:"));
                    const type = prompt("Type (Invoice/Payment/Expense):", "Expense");
                    try {
                        await api.post('/api/admin/accounting/transactions', {
                            date: new Date(), description: desc, type, amount, status: 'Paid'
                        });
                        fetchTxs();
                    } catch (e) { alert('Error'); }
                }}>Record Transaction</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="p-4 bg-slate-50 border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">Total Receivables</div>
                    <div className="text-2xl font-bold text-slate-900">${totalReceivables.toLocaleString('en-CA')}</div>
                </Card>
                <Card className="p-4 bg-slate-50 border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">YTD Income</div>
                    <div className="text-2xl font-bold text-green-600">${ytdIncome.toLocaleString('en-CA')}</div>
                </Card>
                <Card className="p-4 bg-slate-50 border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">Expenses</div>
                    <div className="text-2xl font-bold text-slate-700">${expenses.toLocaleString('en-CA')}</div>
                </Card>
            </div>

            <Card title="General Ledger">
                <Table
                    headers={['Date', 'Description', 'Type', 'Amount', 'Balance', 'Status', 'Actions']}
                    data={transactions}
                    renderRow={(tx) => (
                        <>
                            <td>{tx.date}</td>
                            <td className="font-medium text-slate-900">{tx.description}</td>
                            <td>
                                <span className={`px-2.5 py-1 rounded text-xs font-medium ${tx.type === 'Invoice' ? 'bg-slate-100 text-slate-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                    {tx.type}
                                </span>
                            </td>
                            <td>
                                <span className={tx.amount < 0 ? 'text-green-600 font-medium' : 'text-slate-900 font-medium'}>
                                    {tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                                </span>
                            </td>
                            <td className="font-bold text-slate-900">${tx.balance.toFixed(2)}</td>
                            <td>
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${tx.status === 'Unpaid' ? 'bg-red-100 text-red-700' :
                                    tx.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                    {tx.status}
                                </span>
                            </td>
                            <td>
                                {tx.balance > 0 && tx.type === 'Invoice' && (
                                    <Button size="sm" variant="ghost" onClick={() => setSelectedInvoice(tx)}>Pay</Button>
                                )}
                            </td>
                        </>
                    )}
                />
            </Card>

            {selectedInvoice && (
                <PaymentModal
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onSubmit={(data) => {
                        console.log('Processing payment:', data);
                        // In real world, call API to record payment
                        setSelectedInvoice(null);
                    }}
                />
            )}
        </DashboardLayout>
    );
};
