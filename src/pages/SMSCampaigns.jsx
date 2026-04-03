import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Send, Users, Building2, CheckCircle, Clock, AlertCircle, Plus, X, Search, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { hasPermission } from '../utils/permissions';

const SMSCampaigns = () => {
    const [__forceUpdate, __setForceUpdate] = useState(0);
    useEffect(() => {
        const handleUpdate = () => __setForceUpdate(p => p + 1);
        window.addEventListener('permissionsUpdated', handleUpdate);
        return () => window.removeEventListener('permissionsUpdated', handleUpdate);
    }, []);

    const [campaigns, setCampaigns] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [useTemplate, setUseTemplate] = useState(true);
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        templateId: '',
        customContent: '',
        buildingId: '',
        recipientType: 'TENANTS'
    });

    // Pagination for Campaign List
    const [currentPage, setCurrentPage] = useState(1);
    const campaignsPerPage = 4;

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchCampaigns, 5000); // Poll for progress
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchCampaigns(),
                fetchTemplates(),
                fetchBuildings()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const response = await api.get('/api/communication/campaigns');
            setCampaigns(response.data);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/api/communication/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const fetchBuildings = async () => {
        try {
            const response = await api.get('/api/admin/properties?limit=1000');
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setBuildings(data);
        } catch (error) {
            console.error('Error fetching buildings:', error);
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newCampaign };
            if (useTemplate) {
                payload.customContent = '';
            } else {
                payload.templateId = '';
            }

            await api.post('/api/communication/campaign', payload);
            setIsModalOpen(false);
            setNewCampaign({ name: '', templateId: '', customContent: '', buildingId: '', recipientType: 'TENANTS' });
            fetchCampaigns();
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert(error.response?.data?.error || 'Failed to start campaign');
        }
    };

    const handleDeleteCampaign = async (id) => {
        if (!window.confirm('Are you sure you want to delete this campaign? This won\'t stop any active sends but will remove it from history.')) return;
        try {
            await api.delete(`/api/communication/campaign/${id}`);
            fetchCampaigns();
        } catch (error) {
            console.error('Error deleting campaign:', error);
            alert('Failed to delete campaign');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
            case 'PROCESSING': return <Clock className="h-5 w-5 text-amber-500 animate-pulse" />;
            case 'FAILED': return <AlertCircle className="h-5 w-5 text-red-500" />;
            default: return <Clock className="h-5 w-5 text-slate-400" />;
        }
    };

    return (
        <MainLayout title="SMS Campaigns">
            <div className="space-y-6 text-slate-800 p-4 lg:p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Send className="h-6 w-6 text-indigo-600" />
                            SMS Campaigns
                        </h1>
                        <p className="text-gray-500 mt-1">Broadcast messages to buildings or specific tenant groups.</p>
                    </div>
                    {hasPermission('Campaign Manager', 'add') && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                            New Campaign
                        </button>
                    )}
                </div>

                {/* Campaign List */}
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-white h-24 rounded-3xl animate-pulse border border-gray-100"></div>
                        ))
                    ) : campaigns.length === 0 ? (
                        <div className="bg-white p-20 text-center rounded-3xl border border-dashed border-gray-200">
                            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600">No campaigns yet</h3>
                            <p className="text-gray-400 mt-2">Start your first broadcast to reach your tenants.</p>
                        </div>
                    ) : (
                        (() => {
                            const totalPages = Math.ceil(campaigns.length / campaignsPerPage);
                            const startIndex = (currentPage - 1) * campaignsPerPage;
                            const currentCampaigns = campaigns.slice(startIndex, startIndex + campaignsPerPage);

                            return (
                                <>
                                    {currentCampaigns.map(campaign => (
                                        <div key={campaign.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6 group">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`p-4 rounded-2xl ${campaign.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    <Building2 className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                                        {campaign.name}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1 underline-offset-4 decoration-2">
                                                        <span className="text-xs text-gray-400 font-bold">#{campaign.id}</span>
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(campaign.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Section */}
                                            <div className="flex flex-col items-end gap-2 w-full md:w-64">
                                                <div className="flex justify-between w-full text-xs font-bold uppercase tracking-wider text-gray-400">
                                                    <span>Progress</span>
                                                    <span className={campaign.status === 'PROCESSING' ? 'text-amber-500' : 'text-gray-600'}>
                                                        {campaign.successCount + campaign.failedCount} / {campaign.totalRecipients}
                                                    </span>
                                                </div>
                                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ${campaign.status === 'FAILED' ? 'bg-red-500' : 'bg-indigo-600'}`}
                                                        style={{ width: `${( (campaign.successCount + campaign.failedCount) / campaign.totalRecipients) * 100}%` }}
                                                    />
                                                </div>
                                                <div className="flex gap-4 text-[10px] font-black uppercase tracking-tighter">
                                                    <span className="text-emerald-500">Success: {campaign.successCount}</span>
                                                    <span className="text-red-500">Failed: {campaign.failedCount}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 pl-0 md:pl-6 md:border-l border-gray-100 w-full md:w-auto justify-between md:justify-end">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(campaign.status)}
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">{campaign.status}</span>
                                                </div>
                                                {hasPermission('Campaign Manager', 'delete') && (
                                                    <button 
                                                        onClick={() => handleDeleteCampaign(campaign.id)}
                                                        className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-all"
                                                        title="Delete Campaign"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* List Pagination Controls */}
                                    {campaigns.length > campaignsPerPage && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-6 rounded-[2rem] mt-6 border border-gray-100 gap-4">
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                Showing {startIndex + 1} - {Math.min(startIndex + campaignsPerPage, campaigns.length)} of {campaigns.length} Campaigns
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="p-2 hover:bg-gray-50 rounded-xl disabled:opacity-20 transition-all"
                                                >
                                                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                                                </button>
                                                
                                                <div className="flex items-center gap-1">
                                                    {[...Array(totalPages)].map((_, i) => {
                                                        const pageNum = i + 1;
                                                        // Simple logic to show only current, first, last and surrounding pages if many
                                                        if (
                                                            totalPages <= 7 || 
                                                            pageNum === 1 || 
                                                            pageNum === totalPages || 
                                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                        ) {
                                                            return (
                                                                <button
                                                                    key={pageNum}
                                                                    onClick={() => setCurrentPage(pageNum)}
                                                                    className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${
                                                                        currentPage === pageNum 
                                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' 
                                                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            );
                                                        } else if (
                                                            (pageNum === 2 && currentPage > 3) || 
                                                            (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                                        ) {
                                                            return <span key={pageNum} className="px-1 text-gray-300">...</span>;
                                                        }
                                                        return null;
                                                    })}
                                                </div>

                                                <button 
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="p-2 hover:bg-gray-50 rounded-xl disabled:opacity-20 transition-all"
                                                >
                                                    <ChevronRight className="h-5 w-5 text-gray-600" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()
                    )}
                </div>

                {/* Create Campaign Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white w-full max-w-xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 my-auto">
                            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30 shrink-0">
                                <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">New Broadcast</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                                    <X className="h-5 md:h-6 w-5 md:w-6 text-gray-400" />
                                </button>
                            </div>
                            
                            <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
                                <form onSubmit={handleCreateCampaign} className="p-6 md:p-10 space-y-6 md:space-y-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Campaign Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={newCampaign.name}
                                            onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                                            className="w-full px-5 md:px-6 py-3 md:py-4 border-2 border-gray-100 rounded-2xl md:rounded-3xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50/30 font-bold text-gray-700"
                                            placeholder="e.g. October Maintenance Alert"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Target Audience</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                            {['TENANTS', 'COWORKERS', 'ALL'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setNewCampaign({...newCampaign, recipientType: type})}
                                                    className={`px-4 py-3 rounded-xl md:rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        newCampaign.recipientType === type 
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm' 
                                                        : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-100'
                                                    }`}
                                                >
                                                    {type.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap gap-2 md:gap-4 mb-4">
                                            <button 
                                                type="button"
                                                onClick={() => setUseTemplate(true)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${useTemplate ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                                            >
                                                Use Template
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setUseTemplate(false)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!useTemplate ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                                            >
                                                Custom Message
                                            </button>
                                        </div>

                                        {useTemplate ? (
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Message Template</label>
                                                <select 
                                                    required={useTemplate}
                                                    value={newCampaign.templateId}
                                                    onChange={(e) => setNewCampaign({...newCampaign, templateId: e.target.value})}
                                                    className="w-full px-5 md:px-6 py-3 md:py-4 border-2 border-gray-100 rounded-2xl md:rounded-3xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50/30 font-bold text-gray-700 appearance-none"
                                                >
                                                    <option value="">Select a Template</option>
                                                    {templates.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Message</label>
                                                <textarea 
                                                    required={!useTemplate}
                                                    value={newCampaign.customContent}
                                                    onChange={(e) => setNewCampaign({...newCampaign, customContent: e.target.value})}
                                                    rows="4"
                                                    className="w-full px-5 md:px-6 py-3 md:py-4 border-2 border-gray-100 rounded-2xl md:rounded-3xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50/30 font-bold text-gray-700"
                                                    placeholder="Type your bulk message here..."
                                                />
                                                <p className="mt-2 text-[10px] text-gray-400 font-bold italic">Character count: {newCampaign.customContent.length}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Target Building</label>
                                        <select 
                                            value={newCampaign.buildingId}
                                            disabled={newCampaign.recipientType === 'COWORKERS'}
                                            onChange={(e) => setNewCampaign({...newCampaign, buildingId: e.target.value})}
                                            className="w-full px-5 md:px-6 py-3 md:py-4 border-2 border-gray-100 rounded-2xl md:rounded-3xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50/30 font-bold text-gray-700 appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <option value="">All Buildings</option>
                                            {buildings.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="bg-amber-50 p-6 rounded-2xl md:rounded-3xl border border-amber-100 flex gap-4">
                                        <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                            Note: This will send individual SMS messages according to your selection. This process runs at a rate of 1 message per second.
                                        </p>
                                    </div>

                                    <div className="flex flex-col-reverse md:flex-row justify-end gap-3 md:gap-4 pt-4">
                                        <button 
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="w-full md:w-auto px-8 py-3 md:py-4 border-2 border-gray-100 text-gray-500 font-black uppercase tracking-widest rounded-2xl md:rounded-3xl hover:bg-gray-50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            className="w-full md:w-auto px-10 md:px-12 py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl md:rounded-3xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                                        >
                                            <Send className="h-4 w-4" />
                                            Start Broadcast
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default SMSCampaigns;
