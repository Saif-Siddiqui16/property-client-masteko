import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Calendar, 
    Hammer, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    Filter, 
    Search, 
    MoreVertical, 
    ChevronRight,
    Sparkles,
    CheckSquare,
    User,
    ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '../../layouts/MainLayout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UnitPrepDashboard = () => {
    const [prepUnits, setPrepUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        readyCleaning: 0,
        cleaningInProgress: 0,
        cleaningCompleted: 0,
        unitReady: 0
    });

    useEffect(() => {
        fetchPrepUnits();
    }, []);

    const fetchPrepUnits = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/admin/workflow/move-out`, { // Prep units are derived from MoveOuts or Units in Prep
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter and map logic for prep columns
            if (res.data.success) {
                // Mocking some prep data for visualization as the backend service just started
                setPrepUnits(res.data.data);
                calculateStats(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching prep units:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const s = { pending: 0, readyCleaning: 0, cleaningInProgress: 0, cleaningCompleted: 0, unitReady: 0 };
        // Simplified logic for demo
        data.forEach(item => {
            if (item.status === 'READY_FOR_COMPLETION') s.pending++;
            else s.unitReady++;
        });
        setStats(s);
    };

    const Column = ({ title, icon: Icon, color, count, items, subtitle, badgeColor }) => (
        <div className="flex-1 min-w-[320px] bg-gray-50/50 rounded-3xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h3 className="font-black text-gray-900 text-sm leading-tight tracking-tight">{title}</h3>
                    <p className="text-[10px] font-bold text-gray-400 max-w-[200px] leading-tight">{subtitle}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-black ${badgeColor} shadow-sm border border-white/20`}>
                    {count}
                </span>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                {items.map(item => (
                    <Card key={item.id} item={item} columnTitle={title} />
                ))}
            </div>
        </div>
    );

    const Card = ({ item, columnTitle }) => (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-2xl transition-all group relative overflow-hidden">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="bg-amber-100 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Priority</span>
                        <span className="bg-red-50 text-red-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Prioritized</span>
                    </div>
                    <MoreVertical size={16} className="text-gray-300" />
                </div>

                <div>
                    <h4 className="font-black text-gray-900 text-lg leading-tight tracking-tighter">{item.unit.unitNumber}</h4>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                        <span>2 Bed Unit</span>
                        <span className="text-gray-300">•</span>
                        <span>{item.lease.tenant?.name || 'Amy Chen'}</span>
                    </div>
                </div>

                <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-50">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lease End</span>
                        <span className="text-[10px] font-black text-gray-900 uppercase">Jun 30</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[11px] font-bold text-gray-600">Contact Required</span>
                    </div>
                </div>

                <button className={`w-full py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2
                    ${columnTitle.includes('Deficiencies') ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 
                      columnTitle.includes('Ready for Cleaning') ? 'bg-blue-600 text-white hover:bg-blue-700' :
                      'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {columnTitle.includes('Deficiencies') ? 'Confirm Move-Out' : 
                     columnTitle.includes('Ready for Cleaning') ? 'Schedule Inspection' :
                     columnTitle.includes('Progress') ? 'Open Inspection' : 'Complete Move-In'}
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );

    const StatCard = ({ icon: Icon, label, sublabel, value, color, bg }) => (
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4 hover:shadow-xl transition-all cursor-pointer group">
            <div className={`p-4 rounded-2xl ${bg} ${color} group-hover:scale-110 transition-transform shadow-sm`}>
                <Icon size={24} />
            </div>
            <div className="flex flex-col">
                <span className="text-2xl font-black text-gray-900 leading-none mb-1">{value}</span>
                <span className="text-[13px] font-black text-gray-900 leading-tight mb-0.5">{label}</span>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{sublabel}</span>
            </div>
        </div>
    );

    if (loading) return <div className="p-8 text-center text-gray-500 font-black">PREPARING DASHBOARD...</div>;

    return (
        <MainLayout title="Unit Preparation">
            <div className="p-0 bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Unit Preparation Dashboard</h1>
                    <p className="text-gray-500 text-sm font-medium">Track units moving toward readiness • Follow your exact workflow</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-700 hover:bg-gray-100 transition-colors border border-gray-100">
                        Export <ChevronRight size={18} className="rotate-90 text-gray-400" />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95">
                        <Sparkles size={18} />
                        Schedule Inspection
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-6 gap-4 mb-10">
                <StatCard icon={Calendar} label="Upcoming Move-Outs" sublabel="Next 30 Days" value={18} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={CheckSquare} label="Confirmed Move-Outs" sublabel="Next 30 Days" value={7} color="text-orange-600" bg="bg-orange-50" />
                <StatCard icon={Clock} label="Inspections Scheduled" sublabel="Next 30 Days" value={6} color="text-purple-600" bg="bg-purple-50" />
                <StatCard icon={Hammer} label="In Progress" sublabel="Maintenance active" value={3} color="text-red-600" bg="bg-red-50" />
                <StatCard icon={CheckCircle2} label="Ready for Completion" sublabel="Next 30 Days" value={12} color="text-green-600" bg="bg-green-50" />
                <StatCard icon={Sparkles} label="Units Ready" sublabel="Units Ready" value={12} color="text-indigo-600" bg="bg-indigo-50" />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                    <Filter size={16} className="text-gray-400" />
                    <select className="bg-transparent text-xs font-black text-gray-700 outline-none border-none uppercase tracking-wider">
                        <option>Building: All Buildings</option>
                    </select>
                </div>
                <div className="flex items-center gap-3 ml-4">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" id="priority" />
                    <label htmlFor="priority" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer">Priority Only</label>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 ml-4">
                    <Calendar size={16} className="text-gray-400" />
                    <select className="bg-transparent text-xs font-black text-gray-700 outline-none border-none uppercase tracking-wider">
                        <option>Next 30 Days</option>
                    </select>
                </div>
                <div className="flex-1 relative ml-4">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search units, tenants..." 
                        className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                    />
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-380px)] scrollbar-thin scrollbar-thumb-gray-200">
                <Column 
                    title="Pending Inspection Deficiencies" 
                    subtitle="Blocked due to required tickets: swap components to fix"
                    icon={AlertTriangle} 
                    badgeColor="bg-red-500 text-white" 
                    count={3} 
                    items={prepUnits.filter(p => p.status === 'READY_FOR_COMPLETION').slice(0, 2)}
                />
                <Column 
                    title="Ready for Cleaning" 
                    subtitle="Tenant confirmed: move-out date confirmed"
                    icon={Sparkles} 
                    badgeColor="bg-amber-500 text-white" 
                    count={2} 
                    items={prepUnits.filter(p => p.status === 'PENDING').slice(0, 2)}
                />
                <Column 
                    title="Cleaning In Progress" 
                    subtitle="Visual and Move-Out Inspections in progress"
                    icon={Hammer} 
                    badgeColor="bg-blue-500 text-white" 
                    count={1} 
                    items={prepUnits.filter(p => p.status === 'PENDING').slice(2, 3)}
                />
                <Column 
                    title="Cleaning Completed" 
                    subtitle="Inspections currently being completed"
                    icon={CheckSquare} 
                    badgeColor="bg-green-500 text-white" 
                    count={2} 
                    items={prepUnits.filter(p => p.status === 'READY_FOR_COMPLETION').slice(1, 2)}
                />
                <Column 
                    title="Unit Ready" 
                    subtitle="You are ready for Move-In"
                    icon={CheckCircle2} 
                    badgeColor="bg-indigo-500 text-white" 
                    count={2} 
                    items={prepUnits.filter(p => p.status === 'COMPLETED').slice(0, 2)}
                />
            </div>
            </div>
        </MainLayout>
    );
};

export default UnitPrepDashboard;
