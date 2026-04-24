import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Calendar, 
    UserCheck, 
    Search, 
    PlayCircle, 
    CheckSquare, 
    MoreVertical, 
    ArrowRight, 
    Clock, 
    Filter,
    ChevronRight,
    ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '../../layouts/MainLayout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MoveOutDashboard = () => {
    const [moveOuts, setMoveOuts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        upcoming: 0,
        confirmed: 0,
        scheduled: 0,
        inProgress: 0,
        ready: 0,
        completed: 0
    });

    useEffect(() => {
        fetchMoveOuts();
    }, []);

    const fetchMoveOuts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/admin/workflow/move-out`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMoveOuts(res.data.data);
                calculateStats(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching move-outs:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const s = { upcoming: 0, confirmed: 0, scheduled: 0, inProgress: 0, ready: 0, completed: 0 };
        data.forEach(item => {
            if (item.status === 'PENDING') s.upcoming++;
            if (item.status === 'CONFIRMED') s.confirmed++;
            if (item.status === 'INSPECTION_SCHEDULED') s.scheduled++;
            if (item.status === 'INSPECTION_IN_PROGRESS') s.inProgress++;
            if (item.status === 'READY_FOR_COMPLETION') s.ready++;
            if (item.status === 'COMPLETED') s.completed++;
        });
        setStats(s);
    };

    const Column = ({ title, icon: Icon, color, count, items, subtitle }) => (
        <div className="flex-1 min-w-[320px] bg-gray-50/50 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${color}`}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm tracking-tight">{title}</h3>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{subtitle}</p>
                    </div>
                </div>
                <span className="bg-white px-2 py-1 rounded-lg text-xs font-black text-gray-400 border border-gray-100 shadow-sm">
                    {count}
                </span>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                {items.map(item => (
                    <Card key={item.id} item={item} />
                ))}
            </div>
        </div>
    );

    const Card = ({ item }) => (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group relative overflow-hidden">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Move-Out</span>
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {item.unit.unitNumber}
                        </span>
                    </div>
                    <MoreVertical size={16} className="text-gray-300 hover:text-gray-600 transition-colors" />
                </div>

                <div>
                    <h4 className="font-black text-gray-900 text-base leading-tight tracking-tight">{item.unit.unitNumber}</h4>
                    <p className="text-sm font-bold text-gray-500">{item.lease.tenant?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-400 font-medium">{item.unit.building || 'Main Building'}</p>
                </div>

                <div className="flex flex-col gap-1.5 py-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                        <Calendar size={12} className="text-indigo-400" />
                        Move-Out: {format(new Date(item.targetDate), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                        <Clock size={12} className={item.urgency === 'OVERDUE' ? 'text-red-400' : 'text-orange-400'} />
                        <span className={item.urgency === 'OVERDUE' ? 'text-red-500' : ''}>
                            {Math.abs(item.daysRemaining)} {item.daysRemaining < 0 ? 'days overdue' : 'days remaining'}
                        </span>
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-50 flex flex-col gap-2">
                    <button className="w-full flex items-center justify-between p-2 rounded-xl bg-gray-50 group-hover:bg-indigo-50 transition-colors border border-transparent group-hover:border-indigo-100">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[11px] font-black text-gray-700 group-hover:text-indigo-700 uppercase tracking-wider">
                                {item.status === 'PENDING' ? 'Confirm Move-Out' : 
                                 item.status === 'CONFIRMED' ? 'Schedule Inspection' :
                                 item.status === 'INSPECTION_SCHEDULED' ? 'Start Inspection' :
                                 item.status === 'INSPECTION_IN_PROGRESS' ? 'Resume Inspection' : 'Finish Move-Out'}
                            </span>
                        </div>
                        <ArrowRight size={14} className="text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </button>
                </div>
            </div>
        </div>
    );

    const StatCard = ({ icon: Icon, label, sublabel, value, color, bg }) => (
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4 hover:shadow-lg transition-all cursor-pointer group">
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

    if (loading) return <div className="p-8 text-center text-gray-500 font-black">SYNCING DASHBOARD...</div>;

    return (
        <MainLayout title="Move-Out Dashboard">
            <div className="p-0 bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Move-Out Dashboard</h1>
                    <p className="text-gray-500 text-sm font-medium">Track upcoming move-outs readiness • Follow your exact workflow</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-700 hover:bg-gray-100 transition-colors border border-gray-100">
                        Export <ChevronRight size={18} className="rotate-90 text-gray-400" />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95">
                        <Search size={18} />
                        Schedule Inspection
                    </button>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-6 gap-4 mb-10">
                <StatCard icon={Calendar} label="Upcoming Move-Outs" sublabel="Next 30 Days" value={stats.upcoming} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={UserCheck} label="Confirmed Move-Out" sublabel="Next 30 Days" value={stats.confirmed} color="text-orange-600" bg="bg-orange-50" />
                <StatCard icon={Clock} label="Inspections Scheduled" sublabel="Action needed" value={stats.scheduled} color="text-yellow-600" bg="bg-yellow-50" />
                <StatCard icon={PlayCircle} label="Inspection In Progress" sublabel="Active surveys" value={stats.inProgress} color="text-purple-600" bg="bg-purple-50" />
                <StatCard icon={ClipboardList} label="Inspection In Progress" sublabel="Reports pending" value={stats.inProgress} color="text-green-600" bg="bg-green-50" />
                <StatCard icon={CheckSquare} label="Ready for Completion" sublabel="Ready for end" value={stats.ready} color="text-indigo-600" bg="bg-indigo-50" />
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                    <Filter size={16} className="text-gray-400" />
                    <select className="bg-transparent text-xs font-black text-gray-700 outline-none border-none uppercase tracking-wider">
                        <option>All Buildings</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                    <Calendar size={16} className="text-gray-400" />
                    <select className="bg-transparent text-xs font-black text-gray-700 outline-none border-none uppercase tracking-wider">
                        <option>Move-Out Date: Next 30 Days</option>
                    </select>
                </div>
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search units, tenants..." 
                        className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all shadow-inner"
                    />
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-380px)] scrollbar-thin scrollbar-thumb-gray-200">
                <Column 
                    title="Upcoming Move-Outs" 
                    subtitle="Upcoming within 30 days"
                    icon={Calendar} 
                    color="bg-blue-100 text-blue-600" 
                    count={stats.upcoming} 
                    items={moveOuts.filter(m => m.status === 'PENDING')}
                />
                <Column 
                    title="Confirmed Move-Out" 
                    subtitle="Tenant confirmed"
                    icon={UserCheck} 
                    color="bg-orange-100 text-orange-600" 
                    count={stats.confirmed} 
                    items={moveOuts.filter(m => m.status === 'CONFIRMED')}
                />
                <Column 
                    title="Inspections Scheduled" 
                    subtitle="Action needed"
                    icon={Clock} 
                    color="bg-yellow-100 text-yellow-600" 
                    count={stats.scheduled} 
                    items={moveOuts.filter(m => m.status === 'INSPECTION_SCHEDULED')}
                />
                <Column 
                    title="Inspection In Progress" 
                    subtitle="Active surveys"
                    icon={PlayCircle} 
                    color="bg-purple-100 text-purple-600" 
                    count={stats.inProgress} 
                    items={moveOuts.filter(m => m.status === 'INSPECTION_IN_PROGRESS')}
                />
                <Column 
                    title="Ready for Completion" 
                    subtitle="Ready for end"
                    icon={CheckSquare} 
                    color="bg-green-100 text-green-600" 
                    count={stats.ready} 
                    items={moveOuts.filter(m => m.status === 'READY_FOR_COMPLETION')}
                />
            </div>
            </div>
        </MainLayout>
    );
};

export default MoveOutDashboard;
