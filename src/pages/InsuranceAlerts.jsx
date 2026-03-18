import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
    ShieldAlert,
    ShieldCheck,
    Clock,
    Search,
    Filter,
    Eye,
    ArrowRight,
    X,
    FileText,
    AlertTriangle,
    ExternalLink,
    Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const TODAY = new Date(); // Use real time

export const InsuranceAlerts = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [propertyFilter, setPropertyFilter] = useState('All');
    const [viewPolicy, setViewPolicy] = useState(null);
    const [insuranceData, setInsuranceData] = useState([]);
    const [stats, setStats] = useState({ active: 0, expiring: 0, expired: 0, pending: 0 });
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    const fetchData = async () => {
        try {
            const [dataRes, statsRes] = await Promise.all([
                api.get('/api/admin/insurance/alerts'),
                api.get('/api/admin/insurance/stats')
            ]);
            setInsuranceData(dataRes.data);
            setStats(statsRes.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this insurance policy?')) return;
        try {
            await api.post(`/api/admin/insurance/${id}/approve`);
            setViewPolicy(null);
            fetchData();
        } catch (e) {
            alert('Approval failed');
        }
    };

    const handleReject = async (id) => {
        if (!rejectReason) return alert('Please provide a reason');
        try {
            await api.post(`/api/admin/insurance/${id}/reject`, { reason: rejectReason });
            setViewPolicy(null);
            setShowRejectForm(false);
            setRejectReason('');
            fetchData();
        } catch (e) {
            alert('Rejection failed');
        }
    };

    // Filtered Data
    const filteredData = insuranceData.filter(item => {
        const matchesSearch = item.tenantName.toLowerCase().includes(search.toLowerCase()) ||
            item.policyNumber.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter ||
            (statusFilter === 'EXPIRING_SOON' && item.expiry.label === 'Expiring Soon');
        const matchesProperty = propertyFilter === 'All' || item.property === propertyFilter;
        return matchesSearch && matchesStatus && matchesProperty;
    });

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('All');
        setPropertyFilter('All');
    };

    return (
        <MainLayout title="Insurance Compliance">
            <div className="flex flex-col gap-8 pb-10">

                {/* HEADER SECTION */}
                <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Manage tenant insurance approvals and monitor portfolio compliance.</p>
                </div>

                {/* SUMMARY CARDS */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card
                        className={`p-6 rounded-[24px] cursor-pointer transition-all duration-300 hover:-translate-y-1 border-b-4 ${statusFilter === 'PENDING_APPROVAL' ? 'border-amber-500 shadow-lg' : 'border-transparent shadow-sm bg-white'}`}
                        onClick={() => setStatusFilter('PENDING_APPROVAL')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                <Clock size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.pending}</h3>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mt-1">Pending Approval</p>
                            </div>
                        </div>
                    </Card>

                    <Card
                        className={`p-6 rounded-[24px] cursor-pointer transition-all duration-300 hover:-translate-y-1 border-b-4 ${statusFilter === 'EXPIRED' ? 'border-red-500 shadow-lg' : 'border-transparent shadow-sm bg-white'}`}
                        onClick={() => setStatusFilter('EXPIRED')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                                <ShieldAlert size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.expired}</h3>
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none mt-1">Expired</p>
                            </div>
                        </div>
                    </Card>

                    <Card
                        className={`p-6 rounded-[24px] cursor-pointer transition-all duration-300 hover:-translate-y-1 border-b-4 ${statusFilter === 'EXPIRING_SOON' ? 'border-orange-500 shadow-lg' : 'border-transparent shadow-sm bg-white'}`}
                        onClick={() => setStatusFilter('EXPIRING_SOON')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.expiring}</h3>
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mt-1">Expiring Soon</p>
                            </div>
                        </div>
                    </Card>

                    <Card
                        className={`p-6 rounded-[24px] cursor-pointer transition-all duration-300 hover:-translate-y-1 border-b-4 ${statusFilter === 'ACTIVE' ? 'border-emerald-500 shadow-lg' : 'border-transparent shadow-sm bg-white'}`}
                        onClick={() => setStatusFilter('ACTIVE')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.active}</h3>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mt-1">Active (Compliant)</p>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* FILTERS */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[240px] relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tenant or policy #..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-sm font-medium"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-primary-500 text-sm font-medium bg-white"
                    >
                        <option value="All">All Statuses</option>
                        <option value="PENDING_APPROVAL">Pending Approval</option>
                        <option value="ACTIVE">Active</option>
                        <option value="EXPIRING_SOON">Expiring Soon</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="REJECTED">Rejected</option>
                    </select>

                    <button onClick={clearFilters} className="text-sm font-bold text-slate-400 hover:text-danger px-2 flex items-center gap-1">
                        <X size={16} /> Reset
                    </button>
                </section>

                {/* TABLE */}
                <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tenant Name</th>
                                    <th className="p-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Property / Unit</th>
                                    <th className="p-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Provider</th>
                                    <th className="p-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Policy #</th>
                                    <th className="p-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Expiry</th>
                                    <th className="p-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="p-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredData.length > 0 ? filteredData.map((item) => (
                                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 px-6">
                                            <div className="font-bold text-slate-800 tracking-tight text-sm">{item.tenantName}</div>
                                        </td>
                                        <td className="p-4 px-6 text-sm">
                                            <div className="font-bold text-slate-600">{item.property}</div>
                                            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Unit {item.unit}</div>
                                        </td>
                                        <td className="p-4 px-6 text-sm font-medium text-slate-500">{item.provider}</td>
                                        <td className="p-4 px-6 text-[12px] font-mono text-slate-400">{item.policyNumber}</td>
                                        <td className="p-4 px-6 text-center text-sm font-bold text-slate-600">
                                            {new Date(item.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 px-6 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                item.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 px-6 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => setViewPolicy(item)}
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm border border-transparent hover:border-slate-100"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {item.status === 'PENDING_APPROVAL' && (
                                                    <button
                                                        onClick={() => handleApprove(item.id)}
                                                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Approve Now"
                                                    >
                                                        <ShieldCheck size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="8" className="p-20 text-center text-slate-300 font-bold">No records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* VIEW DETAILS & REVIEW MODAL */}
                {viewPolicy && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in">
                        <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b border-slate-50 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Review Insurance</h3>
                                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">{viewPolicy.tenantName} — Unit {viewPolicy.unit}</p>
                                </div>
                                <button onClick={() => { setViewPolicy(null); setShowRejectForm(false); }} className="p-2 text-slate-400 hover:text-slate-800 rounded-xl">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-50">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Provider</p>
                                        <p className="font-bold text-slate-700 text-sm">{viewPolicy.provider}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Policy #</p>
                                        <p className="font-mono font-bold text-slate-500 text-xs">{viewPolicy.policyNumber}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start Date</p>
                                        <p className="font-bold text-slate-700 text-sm">{viewPolicy.startDate}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End Date</p>
                                        <p className="font-bold text-slate-800 text-sm">{viewPolicy.endDate}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center space-y-3 text-center">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-500">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Policy Evidence Attached</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Review the certificate before approval</p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        className="w-full h-10 rounded-xl text-xs font-bold bg-white border-slate-200 shadow-sm hover:bg-slate-50"
                                        onClick={async () => {
                                            try {
                                                if (!viewPolicy.documentUrl) return alert('No document available');
                                                
                                                // If it's a proxy link, use api.get with blob to include headers
                                                if (viewPolicy.documentUrl.includes('/api/')) {
                                                    const res = await api.get(viewPolicy.documentUrl.replace('?disposition=inline', ''), {
                                                        responseType: 'blob'
                                                    });
                                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `Insurance_${viewPolicy.tenantName}_${viewPolicy.policyNumber}.pdf`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                    window.URL.revokeObjectURL(url);
                                                } else {
                                                    // Fallback for direct links
                                                    window.open(viewPolicy.documentUrl.startsWith('http') ? viewPolicy.documentUrl : `${api.defaults.baseURL.replace(/\/+$/, '')}/${viewPolicy.documentUrl.replace(/^\/+/, '')}`, '_blank');
                                                }
                                            } catch (e) {
                                                console.error('Download failed', e);
                                                alert('Failed to download document');
                                            }
                                        }}
                                    >
                                        <Download size={14} className="mr-2" />
                                        Download Policy Evidence
                                    </Button>
                                </div>

                                {viewPolicy.status === 'PENDING_APPROVAL' && !showRejectForm && (
                                    <div className="pt-2 grid grid-cols-2 gap-4">
                                        <Button variant="secondary" className="h-12 rounded-2xl font-bold" onClick={() => setShowRejectForm(true)}>Reject Policy</Button>
                                        <Button variant="primary" className="h-12 rounded-2xl font-bold" onClick={() => handleApprove(viewPolicy.id)}>Approve Policy</Button>
                                    </div>
                                )}

                                {showRejectForm && (
                                    <div className="space-y-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejection Reason</label>
                                            <textarea
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:border-red-500 min-h-[100px] text-sm font-medium"
                                                placeholder="Explain why the policy was rejected..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Button variant="secondary" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                                            <Button variant="danger" disabled={!rejectReason} onClick={() => handleReject(viewPolicy.id)}>Confirm Reject</Button>
                                        </div>
                                    </div>
                                )}

                                {viewPolicy.status === 'REJECTED' && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Rejection Reason</p>
                                        <p className="text-sm font-bold text-red-600">{viewPolicy.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </MainLayout>
    );
};
