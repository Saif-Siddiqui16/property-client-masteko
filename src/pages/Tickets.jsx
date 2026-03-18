import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Button } from '../components/Button';
import { Search, Eye, Filter, CheckCircle, Clock, AlertTriangle, X, Plus, User, Building, Home, ChevronDown, Trash2, Edit2 } from 'lucide-react';
import clsx from 'clsx';
import api from '../api/client';

const priorityColors = {
    High: 'bg-red-50 text-red-700 border-red-100',
    Medium: 'bg-amber-50 text-amber-700 border-amber-100',
    Low: 'bg-blue-50 text-blue-700 border-blue-100',
};

const statusIcons = {
    'Open': <AlertTriangle size={14} className="text-amber-500" />,
    'In Progress': <Clock size={14} className="text-blue-500" />,
    'Resolved': <CheckCircle size={14} className="text-emerald-500" />,
};

export const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [search, setSearch] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);
    const [viewingTenantDetails, setViewingTenantDetails] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [attachments, setAttachments] = useState({});

    useEffect(() => {
        fetchTickets();
        fetchBuildings();
    }, []);

    useEffect(() => {
        if (selectedBuildingId) {
            fetchTenants(selectedBuildingId);
        } else {
            setTenants([]);
        }
    }, [selectedBuildingId]);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/api/admin/tickets');
            setTickets(res.data);
        } catch (e) {
            console.error('Error fetching tickets', e);
        }
    };

    const fetchBuildings = async () => {
        try {
            const res = await api.get('/api/admin/properties');
            setBuildings(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchTenants = async (buildingId) => {
        try {
            const res = await api.get(`/api/admin/tenants?propertyId=${buildingId}&limit=1000`);
            setTenants(res.data?.data || res.data || []);
        } catch (e) { console.error(e); }
    };

    const filteredTickets = tickets.filter(t =>
        (t.tenant || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.subject || '').toLowerCase().includes(search.toLowerCase())
    );

    const updateStatus = async (id, newStatus) => {
        const ticket = tickets.find(t => t.id === id);
        if (!ticket) return;

        try {
            await api.put(`/api/admin/tickets/${ticket.dbId}/status`, { status: newStatus });
            setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
            setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (e) {
            alert('Failed to update status');
        }
    };

    const handleDeleteTicket = async (dbId) => {
        if (!window.confirm('Are you sure you want to delete this ticket?')) return;
        try {
            await api.delete(`/api/admin/tickets/${dbId}`);
            setTickets(tickets.filter(t => t.dbId !== dbId));
            setSuccessMessage('Ticket Deleted Successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (e) {
            alert('Failed to delete ticket');
        }
    };

    const handleSaveTicket = async (e) => {
        e.preventDefault();
        const form = e.target;
        const tenantId = form.tenantId.value;
        const tenantObj = tenants.find(t => t.id === parseInt(tenantId));

        try {
            const formData = new FormData();
            formData.append('propertyId', selectedBuildingId);
            formData.append('unitId', tenantObj?.unitId || editingTicket?.unitId);
            formData.append('tenantId', tenantId);
            formData.append('subject', form.subject.value);
            formData.append('description', form.description.value);
            formData.append('priority', form.priority.value);

            if (editingTicket) {
                // For editing, we use a regular JSON put if no new files, but controller might expect form-data
                // Simpler to stay consistent with form-data if we want file support, but for text only JSON is easier.
                // However, the current createTicket uses multer.

                await api.put(`/api/admin/tickets/${editingTicket.dbId}`, {
                    tenantId: parseInt(tenantId),
                    propertyId: parseInt(selectedBuildingId),
                    unitId: tenantObj?.unitId,
                    subject: form.subject.value,
                    description: form.description.value,
                    priority: form.priority.value,
                });
            } else {
                // Handle Attachments only for new tickets for now (simple)
                if (form.images.files.length > 0) {
                    Array.from(form.images.files).forEach(file => {
                        formData.append('images', file);
                    });
                }

                if (form.video.files.length > 0) {
                    formData.append('video', form.video.files[0]);
                }

                await api.post('/api/admin/tickets', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            fetchTickets();
            setShowAddModal(false);
            setEditingTicket(null);
            setSelectedBuildingId('');
            setSuccessMessage(editingTicket ? 'Ticket Updated Successfully!' : 'Ticket Created Successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (e) {
            console.error('Error saving ticket:', e);
            alert('Failed to save ticket');
        }
    };

    return (
        <MainLayout title="Maintenance Tickets">
            <div className="flex flex-col gap-6 relative">

                {successMessage && (
                    <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-full duration-500">
                        <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
                            <CheckCircle size={20} />
                            <span className="font-bold">{successMessage}</span>
                        </div>
                    </div>
                )}

                <section className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.06)] gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all w-full md:w-auto md:min-w-[320px]">
                        <Search size={18} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, tenant, or subject"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 w-full text-sm font-medium"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm">
                            <Filter size={16} />
                            Filters
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
                            <Plus size={16} />
                            Add Ticket
                        </Button>
                    </div>
                </section>

                <section className="bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="grid grid-cols-[1fr_1.5fr_1.2fr_1.2fr_1fr_1fr_0.5fr] bg-slate-50 border-b border-slate-200 px-6 py-4">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket ID</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredTickets.map((ticket, index) => (
                            <div
                                key={ticket.id}
                                className="grid grid-cols-[1fr_1.5fr_1.2fr_1.2fr_1fr_1fr_0.5fr] px-6 py-4 items-center hover:bg-slate-50/80 transition-all duration-200"
                            >
                                <span className="text-sm font-medium text-indigo-600">{ticket.id}</span>
                                <span className="text-sm text-slate-700 font-medium truncate pr-4">{ticket.subject}</span>
                                <button
                                    onClick={() => {
                                        setViewingTenantDetails(ticket.tenantDetails || { name: ticket.tenant });
                                    }}
                                    className="text-sm text-indigo-600 font-semibold hover:underline text-left w-fit"
                                >
                                    {ticket.tenant}
                                </button>
                                <span className="text-sm text-slate-500">{ticket.unit}</span>

                                <span>
                                    <span className={clsx("px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-tight", priorityColors[ticket.priority])}>
                                        {ticket.priority}
                                    </span>
                                </span>

                                <span className="flex items-center gap-2 text-sm text-slate-700">
                                    {statusIcons[ticket.status]}
                                    {ticket.status}
                                </span>

                                <span className="flex justify-center gap-1">
                                    <button
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                        title="View Details"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingTicket(ticket);
                                            setSelectedBuildingId(ticket.propertyId?.toString() || '');
                                            setShowAddModal(true);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                        title="Edit Ticket"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTicket(ticket.dbId)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                        title="Delete Ticket"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {selectedTicket && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">{selectedTicket.id}</h3>
                                    <p className="text-sm text-slate-500">Created: {selectedTicket.createdAt}</p>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant</label>
                                        <p className="font-medium text-slate-700">{selectedTicket.tenant}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit</label>
                                        <p className="font-medium text-slate-700">{selectedTicket.unit}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject</label>
                                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">
                                        {selectedTicket.subject}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                                    <p className="text-slate-600 text-sm mt-1">
                                        {selectedTicket.desc || 'No description provided'}
                                    </p>
                                </div>
                                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            Attachments
                                        </label>

                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            {selectedTicket.attachments.map((att, idx) => (
                                                <div
                                                    key={idx}
                                                    className="border border-slate-200 rounded-lg p-2 bg-slate-50"
                                                >
                                                    {att.type === 'image' && (
                                                        <img
                                                            src={att.url}
                                                            alt="attachment"
                                                            className="w-full h-32 object-cover rounded-md"
                                                        />
                                                    )}

                                                    {att.type === 'video' && (
                                                        <video
                                                            src={att.url}
                                                            controls
                                                            className="w-full h-32 rounded-md"
                                                        />
                                                    )}

                                                    <a
                                                        href={att.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block text-xs text-indigo-600 font-semibold mt-2 text-center hover:underline"
                                                    >
                                                        Open in new tab
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Update Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Open', 'In Progress', 'Resolved'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => updateStatus(selectedTicket.id, status)}
                                                className={clsx(
                                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                                                    selectedTicket.status === status
                                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                                                )}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <Button variant="primary" onClick={() => setSelectedTicket(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
                        <form
                            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
                            onSubmit={handleSaveTicket}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-slate-800">
                                    {editingTicket ? 'Edit Ticket' : 'New Maintenance Ticket'}
                                </h3>
                                <button type="button" onClick={() => { setShowAddModal(false); setEditingTicket(null); }} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Building</label>
                                    <div className="relative">
                                        <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={selectedBuildingId}
                                            onChange={(e) => setSelectedBuildingId(e.target.value)}
                                            required
                                            className="w-full pl-12 pr-10 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white appearance-none text-slate-800 font-medium"
                                        >
                                            <option value="">Select Building</option>
                                            <option value="all" className="font-bold text-indigo-600">🏢 All Buildings (Total wide task)</option>
                                            {buildings.map(b => (
                                                <option key={b.id} value={b.id.toString()}>{b.name}{b.civicNumber ? ` - ${b.civicNumber}` : ''}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Tenant</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            name="tenantId"
                                            required={selectedBuildingId !== 'all'}
                                            defaultValue={editingTicket?.tenantId}
                                            disabled={!selectedBuildingId || selectedBuildingId === 'all'}
                                            className="w-full pl-12 pr-10 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white appearance-none text-slate-800 font-medium disabled:opacity-50"
                                        >
                                            <option value="">{selectedBuildingId === 'all' ? 'Not Applicable' : 'Select Tenant'}</option>
                                            {selectedBuildingId !== 'all' && tenants.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Subject</label>
                                    <input
                                        name="subject"
                                        required
                                        defaultValue={editingTicket?.subject}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
                                        placeholder="e.g. Toilet leaking"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Description</label>
                                    <textarea
                                        name="description"
                                        defaultValue={editingTicket?.desc}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 h-24 resize-none"
                                        placeholder="Describe the issue in detail..."
                                    ></textarea>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Priority</label>
                                    <select
                                        name="priority"
                                        defaultValue={editingTicket?.priority || 'Low'}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Images</label>
                                        <input
                                            type="file"
                                            name="images"
                                            multiple
                                            accept=".jpg,.png,.jpeg"
                                            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-600 cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Video</label>
                                        <input
                                            type="file"
                                            name="video"
                                            accept=".mp4,.mov"
                                            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-600 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowAddModal(false); setEditingTicket(null); }}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1">{editingTicket ? 'Update Ticket' : 'Save Ticket'}</Button>
                            </div>
                        </form>
                    </div>
                )}

                {viewingTenantDetails && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Tenant Info</h3>
                                <button onClick={() => setViewingTenantDetails(null)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border-4 border-white shadow-lg">
                                    <User size={40} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900">{viewingTenantDetails.name}</h4>
                                    <div className="flex items-center justify-center gap-1.5 mt-1">
                                        <span className={clsx("w-2 h-2 rounded-full", viewingTenantDetails.leaseStatus === 'Active' ? 'bg-emerald-500' : 'bg-red-500')}></span>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{viewingTenantDetails.leaseStatus} Lease</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 space-y-3">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white text-slate-400 shadow-sm">
                                        <Building size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Unit</p>
                                        <p className="font-semibold text-slate-700">{viewingTenantDetails.property} • {viewingTenantDetails.unit}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <Button variant="secondary" className="flex-1" onClick={() => setViewingTenantDetails(null)}>Close</Button>
                                <Button variant="primary" className="flex-1">View Full Profile</Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </MainLayout>
    );
};
