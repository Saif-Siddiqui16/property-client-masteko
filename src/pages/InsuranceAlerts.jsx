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
    Download,
    Plus,
    Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export const InsuranceAlerts = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [propertyFilter, setPropertyFilter] = useState('All');
    const [insuranceData, setInsuranceData] = useState([]);
    const [stats, setStats] = useState({ active: 0, expiring: 0, expired: 0, missing: 0, pending: 0 });
    
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({
        userId: '', provider: '', policyNumber: '', startDate: '', endDate: '', notes: '', file: null, unitId: '', leaseId: '', insuranceId: '', documentUrl: '', uploadedDocumentId: ''
    });
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        try {
            const [dataRes, statsRes] = await Promise.all([
                api.get('/api/admin/insurance/compliance'),
                api.get('/api/admin/insurance/stats')
            ]);
            setInsuranceData(dataRes.data);
            setStats(statsRes.data);
        } catch (e) { console.error('Failed to load insurance data', e); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAddModal = () => {
        setFormData({ userId: '', provider: '', policyNumber: '', startDate: '', endDate: '', notes: '', file: null, unitId: '', leaseId: '', insuranceId: '', documentUrl: '', uploadedDocumentId: '' });
        setModalMode('add');
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setFormData({
            userId: item.tenantId,
            provider: item.provider !== 'N/A' ? item.provider : '',
            policyNumber: item.policyNumber !== 'N/A' ? item.policyNumber : '',
            startDate: item.startDate !== 'N/A' ? item.startDate : '',
            endDate: item.expiryDate !== 'N/A' ? item.expiryDate : '',
            notes: item.notes || '',
            file: null,
            unitId: item.unitId,
            leaseId: item.leaseId,
            insuranceId: item.insuranceId,
            documentUrl: item.documentUrl || '',
            uploadedDocumentId: item.uploadedDocumentId || ''
        });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            setUploading(true);
            let uploadedDocumentId = null;
            let documentUrl = null;

            if (formData.file) {
                const fd = new FormData();
                fd.append('file', formData.file);
                fd.append('type', 'Insurance');
                fd.append('tenantId', formData.userId);
                
                const uploadRes = await api.post('/api/admin/documents/upload', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedDocumentId = uploadRes.data.id || uploadRes.data.document?.id;
                documentUrl = uploadRes.data.fileUrl || uploadRes.data.document?.fileUrl;
            }

            const payload = {
                userId: formData.userId,
                provider: formData.provider,
                policyNumber: formData.policyNumber,
                endDate: formData.endDate,
                startDate: formData.startDate || new Date().toISOString().split('T')[0],
                notes: formData.notes,
                unitId: formData.unitId,
                leaseId: formData.leaseId
            };
            if (uploadedDocumentId) {
                payload.uploadedDocumentId = uploadedDocumentId;
                payload.documentUrl = documentUrl;
            }

            if (modalMode === 'add') {
                if (!formData.file) {
                    alert("A document upload is mandatory when adding a new record.");
                    setUploading(false);
                    return;
                }
                await api.post('/api/admin/insurance', payload);
            } else {
                await api.put(`/api/admin/insurance/${formData.insuranceId}`, payload);
            }

            setShowModal(false);
            fetchData();
        } catch (e) {
            console.error('Submit failed', e);
            alert('Failed to save insurance record.');
        } finally {
            setUploading(false);
        }
    };

    const handleTenantSelect = (e) => {
        const tId = e.target.value;
        const tenantInfo = insuranceData.find(t => t.tenantId.toString() === tId);
        setFormData({
            ...formData,
            userId: tId,
            unitId: tenantInfo?.unitId || '',
            leaseId: tenantInfo?.leaseId || ''
        });
    };

    // Filtered Data
    const filteredData = insuranceData.filter(item => {
        const matchesSearch = item.tenantName.toLowerCase().includes(search.toLowerCase()) ||
            (item.policyNumber && item.policyNumber.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter ||
            (statusFilter === 'EXPIRING_SOON' && item.status === 'EXPIRING_SOON') || (statusFilter === 'MISSING' && item.status === 'MISSING');
        const matchesProperty = propertyFilter === 'All' || item.building === propertyFilter;
        return matchesSearch && matchesStatus && matchesProperty;
    });

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('All');
        setPropertyFilter('All');
    };

    const handleViewDocument = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');
        const baseUrl = api.defaults.baseURL || '';
        let url = formData.documentUrl;
        if (formData.uploadedDocumentId) {
            url = `${baseUrl}/api/admin/documents/${formData.uploadedDocumentId}/download?disposition=inline&token=${token}`;
        } else if (url && !url.startsWith('http')) {
            url = `${baseUrl}${url}`;
        }
        if (url) window.open(url, '_blank');
    };

    return (
        <MainLayout title="Tenant Insurance Compliance">
            <div className="flex flex-col gap-8 pb-10">

                {/* HEADER SECTION */}
                <div className="flex justify-between items-center">
                    <p className="text-slate-500 font-medium">Manage tenant insurance records with full visibility and compliance tracking.</p>
                    <Button onClick={openAddModal} variant="primary" className="rounded-xl shadow-md flex items-center gap-2">
                        <Plus size={18} /> Add Insurance
                    </Button>
                </div>

                {/* SUMMARY CARDS */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card
                        className={`p-6 rounded-[24px] cursor-pointer transition-all duration-300 hover:-translate-y-1 border-b-4 ${statusFilter === 'MISSING' ? 'border-rose-600 shadow-lg' : 'border-transparent shadow-sm bg-white'}`}
                        onClick={() => setStatusFilter('MISSING')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                                <X size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.missing}</h3>
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none mt-1">Missing Setup</p>
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
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mt-1">Expiring Soon (15d)</p>
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
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-medium"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-sm font-medium bg-white"
                    >
                        <option value="All">All Statuses</option>
                        <option value="MISSING">Missing Setup</option>
                        <option value="ACTIVE">Active</option>
                        <option value="EXPIRING_SOON">Expiring Soon</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="ARCHIVED">Archived History</option>
                    </select>

                    <button onClick={clearFilters} className="text-sm font-bold text-slate-400 hover:text-rose-500 px-2 flex items-center gap-1">
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
                                    <tr key={item.tenantId} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 px-6">
                                            <div className="font-bold text-slate-800 tracking-tight text-sm">{item.tenantName}</div>
                                        </td>
                                        <td className="p-4 px-6 text-sm">
                                            <div className="font-bold text-slate-600">{item.building}</div>
                                            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Unit {item.unitNumber}</div>
                                        </td>
                                        <td className="p-4 px-6 text-sm font-medium text-slate-500">{item.provider}</td>
                                        <td className="p-4 px-6 text-[12px] font-mono text-slate-400">{item.policyNumber}</td>
                                        <td className="p-4 px-6 text-center text-sm font-bold text-slate-600">
                                            {item.expiryDate !== 'N/A' ? item.expiryDate : '-'}
                                        </td>
                                        <td className="p-4 px-6 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border 
                                                ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                item.status === 'EXPIRING_SOON' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                item.status === 'MISSING' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                item.status === 'EXPIRED' ? 'bg-red-50 text-red-600 border-red-100' :
                                                'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 px-6 text-right">
                                            <div className="flex justify-end gap-1">
                                                {item.status !== 'MISSING' && (
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                                                        title="Edit / Replace Details"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="p-20 text-center text-slate-300 font-bold">No records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* MODAL FOR ADD / EDIT INSURANCE */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in">
                        <div className="bg-white rounded-[24px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                        {modalMode === 'add' ? 'Add New Insurance' : 'Update Existing Insurance'}
                                    </h3>
                                    <p className="text-slate-500 font-medium text-xs mt-0.5">
                                        {modalMode === 'add' ? 'Upload document to make record ACTIVE.' : 'Replace document or update expiry date.'}
                                    </p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                
                                <div className="space-y-4">
                                    {modalMode === 'add' ? (
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex gap-1">Tenant <span className="text-rose-500">*</span></label>
                                                <select
                                                    required
                                                    value={formData.userId}
                                                    onChange={handleTenantSelect}
                                                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 bg-white font-medium text-sm transition-all"
                                                >
                                                    <option value="">-- Select Tenant --</option>
                                                    {Array.from(new Map(insuranceData.map(item => [item.tenantId, item])).values()).map(t => (
                                                        <option key={t.tenantId} value={t.tenantId}>
                                                            {t.tenantName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            {/* Auto-filled Building & Unit */}
                                            {formData.userId && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left block">Building</label>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            value={insuranceData.find(t => t.tenantId.toString() === formData.userId.toString())?.building || ''}
                                                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left block">Unit / Bedroom</label>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            value={insuranceData.find(t => t.tenantId.toString() === formData.userId.toString())?.unitNumber || ''}
                                                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Updating Record For</p>
                                                <p className="font-bold text-slate-700">{insuranceData.find(t => t.tenantId === formData.userId)?.tenantName}</p>
                                            </div>
                                            {/* Auto-filled Building & Unit */}
                                            {formData.userId && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left block">Building</label>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            value={insuranceData.find(t => t.tenantId.toString() === formData.userId.toString())?.building || ''}
                                                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left block">Unit / Bedroom</label>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            value={insuranceData.find(t => t.tenantId.toString() === formData.userId.toString())?.unitNumber || ''}
                                                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left block">Provider</label>
                                            <input
                                                type="text"
                                                value={formData.provider}
                                                onChange={(e) => setFormData({...formData, provider: e.target.value})}
                                                placeholder="e.g. StateFarm"
                                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-sm font-medium transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left block">Policy #</label>
                                            <input
                                                type="text"
                                                value={formData.policyNumber}
                                                onChange={(e) => setFormData({...formData, policyNumber: e.target.value})}
                                                placeholder="POL-123456"
                                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-sm font-mono transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left block">Start Date</label>
                                            <input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-sm font-medium transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left block flex gap-1">Expiry Date {modalMode === 'add' && <span className="text-rose-500">*</span>}</label>
                                            <input
                                                type="date"
                                                required={modalMode === 'add'}
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-sm font-medium transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left block flex gap-1">Policy Document {modalMode === 'add' && <span className="text-rose-500">*</span>}</label>
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                            <input 
                                                type="file" 
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                style={{position: 'relative'}}
                                            />
                                            <FileText className="text-slate-300 mb-2" size={32} />
                                            {formData.file ? (
                                                <p className="text-sm font-bold text-indigo-600">{formData.file.name}</p>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-bold text-slate-600">Click or drag file to upload</p>
                                                    <p className="text-[10px] font-medium text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                                                </>
                                            )}
                                        </div>
                                        {modalMode === 'edit' && !formData.file && formData.documentUrl && (
                                            <button onClick={handleViewDocument} type="button" className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 mt-2 hover:underline">
                                                <ExternalLink size={12} /> View Current Attached Document
                                            </button>
                                        )}
                                        {modalMode === 'edit' && !formData.file && (
                                            <p className="text-[10px] text-slate-500 italic mt-1">Leave empty to keep current document.</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left block">Notes (Optional)</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                            placeholder="Any internal caveats or exemptions..."
                                            className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-sm font-medium transition-all min-h-[80px]"
                                        />
                                    </div>

                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                                    <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="rounded-xl px-6">Cancel</Button>
                                    <Button type="submit" variant="primary" className="rounded-xl px-8 shadow-md" disabled={uploading}>
                                        {uploading ? 'Saving...' : 'Save Insurance'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </MainLayout>
    );
};
