import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Plus, 
    Search, 
    Filter, 
    Calendar, 
    ChevronRight, 
    MoreVertical, 
    FileText, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    User,
    ClipboardList,
    Download,
    Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const InspectionList = () => {
    const navigate = useNavigate();
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInspections();
    }, []);

    const fetchInspections = async () => {
        try {
            const token = localStorage.getItem('token');
            // Assuming we added a getInspections endpoint or using the workflow one
            const res = await axios.get(`${API_BASE}/admin/workflow/move-out`, { 
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                // Mocking inspection data based on screenshots
                setInspections([
                    { id: 1, type: 'Move-Out', unit: '82-101-2', tenant: 'Amy Chen', date: 'Jun 30, 2025', inspector: 'Steve Johnson', status: 'In Progress', signature: 'Pending', tickets: 2 },
                    { id: 2, type: 'Move-In', unit: '82-203-1', tenant: 'David Lee', date: 'Jun 28, 2025', inspector: 'Maria Garcia', status: 'Completed', signature: 'Signed', tickets: 1 },
                    { id: 3, type: 'Move-Out', unit: '81-105-3', tenant: 'John Smith', date: 'Jun 27, 2025', inspector: 'Steve Johnson', status: 'Completed', signature: 'Signed', tickets: 3 },
                    { id: 4, type: 'Move-In', unit: '83-302-2', tenant: 'Sophie Kim', date: 'Jun 25, 2025', inspector: 'Maria Garcia', status: 'Scheduled', signature: 'Pending', tickets: 0 },
                    { id: 5, type: 'Move-Out', unit: '81-204-1', tenant: 'Michael Brown', date: 'Jun 22, 2025', inspector: 'James Wilson', status: 'Completed', signature: 'Signed', tickets: 4 }
                ]);
            }
        } catch (error) {
            console.error('Error fetching inspections:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-50 text-green-600 border-green-100';
            case 'In Progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Scheduled': return 'bg-gray-50 text-gray-500 border-gray-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    const getSignatureStyle = (sig) => {
        return sig === 'Signed' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50';
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-black tracking-tighter">LOADING INSPECTIONS...</div>;

    return (
        <MainLayout title="Inspection List">
            <div className="p-0 bg-transparent min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Inspections</h1>
                    <p className="text-gray-500 text-sm font-medium">Manage and track property inspections across all units</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/admin/workflow/inspections/new')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        New Inspection
                    </button>
                    <button className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <Calendar size={20} />
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-8 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <FilterGroup label="Inspection Type" options={['All', 'Move-In', 'Move-Out']} />
                <FilterGroup label="Status" options={['All', 'Scheduled', 'In Progress', 'Completed']} />
                <FilterGroup label="Building" options={['All Buildings', 'Building A', 'Building B']} />
                <FilterGroup label="Unit / Bedroom" options={['All Units']} />
                <FilterGroup label="Inspector" options={['All Inspectors']} />
                
                <div className="flex-1 min-w-[200px] relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search inspections..." 
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">My Inspections</span>
                    <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-6 py-4">Inspection Type</th>
                            <th className="px-6 py-4">Unit / Bedroom</th>
                            <th className="px-6 py-4">Tenant</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Inspector</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Signature</th>
                            <th className="px-6 py-4">Tickets</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {inspections.map((insp) => (
                            <tr key={insp.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${insp.type === 'Move-Out' ? 'bg-blue-500' : 'bg-indigo-500'}`} />
                                        <span className="font-bold text-gray-900">{insp.type}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-black text-gray-700">{insp.unit}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] text-indigo-600">
                                            {insp.tenant.charAt(0)}
                                        </div>
                                        {insp.tenant}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-500">{insp.date}</td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-500">{insp.inspector}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(insp.status)}`}>
                                        {insp.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${getSignatureStyle(insp.signature)}`}>
                                        {insp.signature}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded-md text-xs font-black text-gray-500">
                                        {insp.tickets}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-200">
                                            <Eye size={16} className="text-gray-400" />
                                        </button>
                                        <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-xl text-[11px] font-black text-gray-700 uppercase hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                                            Open <ChevronRight size={14} className="text-gray-400" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Mock */}
            <div className="mt-8 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Showing 1 to 5 of 23 inspections</span>
                <div className="flex items-center gap-2">
                    <button className="p-2 bg-gray-50 rounded-xl border border-gray-100 text-gray-400"><ChevronRight size={16} className="rotate-180" /></button>
                    <button className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-xl text-xs font-black">1</button>
                    <button className="w-8 h-8 flex items-center justify-center bg-white text-gray-500 rounded-xl text-xs font-black hover:bg-gray-50">2</button>
                    <button className="w-8 h-8 flex items-center justify-center bg-white text-gray-500 rounded-xl text-xs font-black hover:bg-gray-50">3</button>
                    <button className="p-2 bg-gray-50 rounded-xl border border-gray-100 text-gray-400"><ChevronRight size={16} /></button>
                </div>
            </div>
            </div>
        </MainLayout>
    );
};

const FilterGroup = ({ label, options }) => (
    <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{label}</label>
        <div className="relative">
            <select className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black text-gray-700 outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors">
                {options.map(opt => <option key={opt}>{opt}</option>)}
            </select>
            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
        </div>
    </div>
);

export default InspectionList;
