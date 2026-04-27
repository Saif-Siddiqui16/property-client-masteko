import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { 
    Calendar, 
    Lock, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    Filter, 
    Search, 
    MoreVertical,
    Clock,
    FileCheck,
    Hammer,
    User,
    ChevronRight,
    Unlock
} from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '../../layouts/MainLayout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MoveInDashboard = () => {
    const navigate = useNavigate();
    const [moveIns, setMoveIns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        upcoming: 0,
        blockedPrep: 0,
        blockedReq: 0,
        readyInspection: 0,
        completed: 0
    });

    useEffect(() => {
        fetchMoveIns();
    }, []);

    const fetchMoveIns = async () => {
        try {
            const res = await api.get('/api/admin/workflow/move-in');
            if (res.data.success) {
                setMoveIns(res.data.data);
                calculateStats(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching move-ins:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOverride = async (id) => {
        const reason = window.prompt("Reason for admin override:");
        if (!reason) return;
        const missing = window.prompt("Missing items (comma separated):");
        
        try {
            const res = await api.post(`/api/admin/workflow/move-in/${id}/override`, {
                reason,
                missingItems: missing || ''
            });
            
            if (res.data.success) {
                alert('Override successful');
                fetchMoveIns();
            }
        } catch (error) {
            alert('Override failed: ' + (error.response?.data?.message || error.message));
        }
    };
    const calculateStats = (data) => {
        const s = { upcoming: 0, blockedPrep: 0, blockedReq: 0, readyInspection: 0, completed: 0 };
        data.forEach(item => {
            if (item.status === 'PENDING') s.upcoming++;
            if (item.status === 'BLOCKED_IN_PREPARATION' || item.status === 'BLOCKED_IN_CONSTRUCTION') s.blockedPrep++;
            if (item.status === 'REQUIREMENTS_PENDING') s.blockedReq++;
            if (item.status === 'READY_FOR_MOVE_IN') s.readyInspection++;
            if (item.status === 'INSPECTION_COMPLETED') s.completed++;
        });
        setStats(s);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'BLOCKED_IN_PREPARATION':
            case 'BLOCKED_IN_CONSTRUCTION': return 'bg-red-50 text-red-600 border-red-100';
            case 'REQUIREMENTS_PENDING': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'READY_FOR_MOVE_IN': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'INSPECTION_COMPLETED': return 'bg-green-50 text-green-600 border-green-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const Column = ({ title, subtitle, icon: Icon, color, count, items }) => (
        <div className="flex-1 min-w-[320px] bg-gray-50/50 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${color}`}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                        <p className="text-xs text-gray-500">{subtitle}</p>
                    </div>
                </div>
                <span className="bg-white px-2 py-1 rounded-md text-xs font-bold text-gray-400 border border-gray-100">
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

    const handleCompleteMoveIn = async (id) => {
        if (!window.confirm("Are you sure you want to finalize this move-in and mark the unit as OCCUPIED?")) return;
        try {
            setLoading(true);
            const res = await api.post(`/api/admin/workflow/move-in/${id}/approve`);
            if (res.data.success) {
                alert('Move-in completed successfully! Unit is now OCCUPIED.');
                fetchMoveIns();
            }
        } catch (error) {
            alert('Failed to complete move-in: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const Card = ({ item }) => {
        const handleAction = (e) => {
            e.stopPropagation();
            if (item.status === 'REQUIREMENTS_PENDING') {
                handleOverride(item.id);
            } else if (item.status === 'READY_FOR_MOVE_IN') {
                navigate('/admin/workflow/inspections/new', { state: { moveInId: item.id } });
            } else if (item.status === 'INSPECTION_COMPLETED') {
                handleCompleteMoveIn(item.id);
            }
        };

        return (
            <div 
                onClick={handleAction}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group relative"
            >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={16} className="text-gray-400" />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded">PRIORITY</span>
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {item.unit.unitNumber}
                        </span>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900">{item.unit.unitNumber}</h4>
                        <p className="text-sm text-gray-600">
                            {item.lease?.tenant?.name || item.unit?.reserved_by_user?.name || 'Prospect Reservation'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={14} />
                        <span>Move-in: {item.targetDate ? format(new Date(item.targetDate), 'MMM d, yyyy') : 'N/A'}</span>
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {item.daysRemaining || 0} days
                        </span>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex flex-col gap-2">
                        <div 
                            className={`w-full flex items-center justify-between p-2 rounded-xl bg-gray-50 group-hover:bg-indigo-50 transition-colors border border-transparent group-hover:border-indigo-100 ${loading ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[11px] font-black text-gray-700 group-hover:text-indigo-700 uppercase tracking-wider">
                                    {item.status.includes('BLOCKED') ? 'Check Readiness' : 
                                     item.status === 'REQUIREMENTS_PENDING' ? 'Admin Override' :
                                     item.status === 'READY_FOR_MOVE_IN' ? 'Start Inspection' :
                                     item.status === 'INSPECTION_COMPLETED' ? 'Process Move-In' : 'Complete Move-In'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {item.requirements && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <Requirement badge="Rent" status={item.requirements.deposit} />
                            <Requirement badge="Deposit" status={item.requirements.deposit} />
                            <Requirement badge="Insurance" status={item.requirements.insurance} />
                            <Requirement badge="Signed" status={true} />
                        </div>
                    )}

                    <div className="mt-2 group-hover:translate-x-1 transition-transform flex items-center gap-1 text-[11px] font-bold text-indigo-600 uppercase">
                        Next Action: {item.status.includes('BLOCKED') ? 'Complete Readiness' : 'Process Move-In'}
                        <ArrowRight size={12} />
                    </div>
                </div>
            </div>
        );
    };

    const Requirement = ({ badge, status }) => (
        <div className="flex items-center gap-1.5">
            {status ? <CheckCircle2 size={12} className="text-green-500" /> : <AlertCircle size={12} className="text-red-500" />}
            <span className={`text-[10px] font-medium ${status ? 'text-gray-700' : 'text-red-500'}`}>{badge}</span>
        </div>
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    return (
        <MainLayout title="Move-In Dashboard">
            <div className="p-0 bg-transparent min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Move-In Dashboard</h1>
                    <p className="text-gray-500 text-sm">Track tenant move-ins and readiness • Follow your exact workflow</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                        Export <ChevronRight size={16} className="rotate-90" />
                    </button>
                    <button 
                        onClick={() => navigate('/admin/workflow/inspections/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm"
                    >
                        <Calendar size={16} />
                        Schedule Inspection
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-4 mb-8">
                <StatCard icon={Calendar} label="Upcoming Move-Ins" sublabel="Next 30 Days" value={stats.upcoming} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={Lock} label="Blocked - In Preparation" sublabel="Unit not ready" value={stats.blockedPrep} color="text-red-600" bg="bg-red-50" />
                <StatCard icon={FileCheck} label="Blocked - Missing Requirements" sublabel="Action needed" value={stats.blockedReq} color="text-orange-600" bg="bg-orange-50" />
                <StatCard icon={Search} label="Ready for Move-In Inspection" sublabel="All conditions met" value={stats.readyInspection} color="text-yellow-600" bg="bg-yellow-50" />
                <StatCard icon={CheckCircle2} label="Inspection Completed" sublabel="Review deficiencies" value={stats.completed} color="text-green-600" bg="bg-green-50" />
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-6 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                        <Filter size={16} className="text-gray-400" />
                        <select className="bg-transparent text-sm font-semibold outline-none border-none">
                            <option>All Buildings</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                        <Calendar size={16} className="text-gray-400" />
                        <select className="bg-transparent text-sm font-semibold outline-none border-none">
                            <option>Next 30 Days</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search units, tenants..." 
                            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-380px)] scrollbar-thin scrollbar-thumb-gray-200">
                <Column 
                    title="Upcoming Move-Ins" 
                    subtitle="Upcoming within 30 days" 
                    icon={Calendar} 
                    color="bg-blue-100 text-blue-600" 
                    count={stats.upcoming} 
                    items={moveIns.filter(m => m.status === 'PENDING')}
                />
                <Column 
                    title="Blocked - In Preparation" 
                    subtitle="Lease/Reservation exists but unit is NOT Ready" 
                    icon={Lock} 
                    color="bg-red-100 text-red-600" 
                    count={stats.blockedPrep} 
                    items={moveIns.filter(m => m.status === 'BLOCKED_IN_PREPARATION' || m.status === 'BLOCKED_IN_CONSTRUCTION')}
                />
                <Column 
                    title="Blocked - Missing Requirements" 
                    subtitle="Unit Ready but Rent/Deposit/Insurance incomplete" 
                    icon={FileCheck} 
                    color="bg-orange-100 text-orange-600" 
                    count={stats.blockedReq} 
                    items={moveIns.filter(m => m.status === 'REQUIREMENTS_PENDING')}
                />
                <Column 
                    title="Ready for Move-In Inspection" 
                    subtitle="Unit Ready + All requirements complete or overridden" 
                    icon={Search} 
                    color="bg-yellow-100 text-yellow-600" 
                    count={stats.readyInspection} 
                    items={moveIns.filter(m => m.status === 'READY_FOR_MOVE_IN')}
                />
                <Column 
                    title="Inspection Completed" 
                    subtitle="Inspection done - check deficiencies" 
                    icon={CheckCircle2} 
                    color="bg-green-100 text-green-600" 
                    count={stats.completed} 
                    items={moveIns.filter(m => m.status === 'INSPECTION_COMPLETED')}
                />
            </div>
            </div>
        </MainLayout>
    );
};

const StatCard = ({ icon: Icon, label, sublabel, value, color, bg }) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-indigo-100 transition-all cursor-pointer group">
        <div className={`p-3 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform`}>
            <Icon size={24} />
        </div>
        <div className="flex flex-col">
            <span className="text-2xl font-black text-gray-900">{value}</span>
            <span className="text-[13px] font-bold text-gray-900 leading-tight">{label}</span>
            <span className="text-[11px] font-medium text-gray-400">{sublabel}</span>
        </div>
    </div>
);

export default MoveInDashboard;
