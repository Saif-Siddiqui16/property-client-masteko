import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Send, Users, Building2, CheckCircle, Clock, AlertCircle, Plus, X, Search, ChevronRight } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';

const SMSCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        templateId: '',
        buildingId: '',
        recipientType: 'TENANTS'
    });

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
            await api.post('/api/communication/campaign', newCampaign);
            setIsModalOpen(false);
            setNewCampaign({ name: '', templateId: '', buildingId: '', recipientType: 'TENANTS' });
            fetchCampaigns();
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert(error.response?.data?.error || 'Failed to start campaign');
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
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        New Campaign
                    </button>
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
                        campaigns.map(campaign => (
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
                                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all hidden md:block" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Create Campaign Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">New Broadcast</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                                    <X className="h-6 w-6 text-gray-400" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleCreateCampaign} className="p-10 space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Campaign Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newCampaign.name}
                                        onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                                        className="w-full px-6 py-4 border-2 border-gray-100 rounded-3xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50/30 font-bold text-gray-700"
                                        placeholder="e.g. October Maintenance Alert"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Target Building</label>
                                        <select 
                                            value={newCampaign.buildingId}
                                            onChange={(e) => setNewCampaign({...newCampaign, buildingId: e.target.value})}
                                            className="w-full px-6 py-4 border-2 border-gray-100 rounded-3xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50/30 font-bold text-gray-700 appearance-none"
                                        >
                                            <option value="">All Buildings</option>
                                            {buildings.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Message Template</label>
                                        <select 
                                            required
                                            value={newCampaign.templateId}
                                            onChange={(e) => setNewCampaign({...newCampaign, templateId: e.target.value})}
                                            className="w-full px-6 py-4 border-2 border-gray-100 rounded-3xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50/30 font-bold text-gray-700 appearance-none"
                                        >
                                            <option value="">Select a Template</option>
                                            {templates.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
                                    <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                        Note: This will send individual SMS messages according to your selection. This process runs in the background at a rate of 1 message per second to ensure delivery.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-4 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-8 py-4 border-2 border-gray-100 text-gray-500 font-black uppercase tracking-widest rounded-3xl hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-3xl transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
                                    >
                                        <Send className="h-4 w-4" />
                                        Start Broadcast
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default SMSCampaigns;
