import React from 'react';
import { 
    ChevronRight, 
    ArrowLeft, 
    Edit2, 
    MoreHorizontal, 
    CheckCircle2, 
    FileText, 
    Image as ImageIcon, 
    MessageSquare, 
    History,
    MoreVertical,
    Clock,
    AlertCircle,
    User,
    Building2,
    Home,
    Download,
    XCircle,
    ArrowRight
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';

const InspectionOverview = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const stats = {
        totalItems: 48,
        completed: 31,
        pending: 12,
        na: 5,
        percent: 65
    };

    return (
        <MainLayout title="Inspection Details">
            <div className="p-0 bg-transparent min-h-screen">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-gray-900 transition-colors shadow-sm">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Move-Out Inspection</h1>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase border border-blue-100 tracking-widest">In Progress</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Inspection ID: INSP-00123 • Type: Move-Out • Scheduled Date: Jun 30, 2025 • Inspector: Steve Johnson</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2.5 bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-gray-900 transition-colors shadow-sm">
                        <Edit2 size={18} />
                    </button>
                    <button className="p-2.5 bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-gray-900 transition-colors shadow-sm">
                        <MoreHorizontal size={18} />
                    </button>
                    <button className="px-8 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                        Complete Inspection
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
                
                {/* Left Column: Details & Progress */}
                <div className="col-span-8 flex flex-col gap-8">
                    
                    {/* Tabs Bar */}
                    <div className="flex items-center gap-8 border-b border-gray-100 pb-1">
                        <Tab label="Overview" active icon={FileText} />
                        <Tab label="Inspection Form" icon={CheckCircle2} onClick={() => navigate(`/admin/workflow/inspections/${id}/form`)} />
                        <Tab label="Photos (12)" icon={ImageIcon} />
                        <Tab label="Notes (3)" icon={MessageSquare} />
                        <Tab label="History" icon={History} />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Inspection Details Card */}
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight uppercase tracking-widest text-[11px] text-gray-400">Inspection Details</h3>
                            <div className="flex flex-col gap-5">
                                <DetailRow label="Inspection Type" value="Move-Out" />
                                <DetailRow label="Template" value="Standard Move-Out" />
                                <DetailRow label="Status" value="In Progress" status="blue" />
                                <DetailRow label="Scheduled Date" value="Jun 30, 2025" />
                                <DetailRow label="Created Date" value="Jun 20, 2025 10:15 AM" />
                                <DetailRow label="Last Updated" value="Jun 25, 2025 2:45 PM" />
                            </div>
                        </div>

                        {/* Inspector / Property Info */}
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight uppercase tracking-widest text-[11px] text-gray-400">Assignment & Location</h3>
                            <div className="flex flex-col gap-5">
                                <DetailRow label="Inspector" value="Steve Johnson" icon={User} />
                                <DetailRow label="Tenant" value="Amy Chen" icon={User} />
                                <DetailRow label="Unit / Bedroom" value="82-101-2" icon={Home} />
                                <DetailRow label="Unit Type" value="2 Bed / 1 Bath" />
                                <DetailRow label="Priority" value="Normal" status="orange" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Progress Summary */}
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center">
                            <h3 className="text-lg font-black text-gray-900 mb-8 self-start uppercase tracking-widest text-[11px] text-gray-400">Progress Summary</h3>
                            <div className="relative w-48 h-48 mb-8">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-gray-50" />
                                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={552} strokeDashoffset={552 - (552 * stats.percent) / 100} className="text-indigo-600 transition-all duration-1000" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-gray-900 leading-none">{stats.percent}%</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Completed</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-4 w-full">
                                <ProgressItem label="Total Items" value={stats.totalItems} color="bg-gray-400" />
                                <ProgressItem label="Completed" value={stats.completed} color="bg-green-500" />
                                <ProgressItem label="Pending" value={stats.pending} color="bg-orange-500" />
                                <ProgressItem label="N/A" value={stats.na} color="bg-gray-200" />
                            </div>
                        </div>

                        {/* Ticket Summary */}
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-widest text-[11px] text-gray-400">Ticket Summary</h3>
                            <div className="flex flex-col gap-4">
                                <TicketStat icon={AlertCircle} label="Total Tickets" value={3} color="bg-red-50 text-red-600" />
                                <TicketStat icon={Clock} label="Open Tickets" value={2} color="bg-orange-50 text-orange-600" />
                                <TicketStat icon={CheckCircle2} label="Resolved Tickets" value={1} color="bg-green-50 text-green-600" />
                            </div>
                            <button className="w-full mt-8 py-3 rounded-2xl bg-gray-50 text-[11px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100 shadow-inner">
                                View All Tickets
                            </button>
                        </div>
                    </div>

                </div>

                {/* Right Column: Actions & Timeline */}
                <div className="col-span-4 flex flex-col gap-8">
                    
                    {/* Action Cards */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-4">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-2">Actions</h3>
                        <QuickAction icon={ArrowRight} label="Resume Inspection" color="bg-indigo-600 text-white" />
                        <QuickAction icon={CheckCircle2} label="Complete Inspection" color="bg-green-50 text-green-600 border border-green-100" />
                        <QuickAction icon={FileText} label="View / Download Report" color="bg-gray-50 text-gray-600 border border-gray-100" />
                        <QuickAction icon={XCircle} label="Cancel Inspection" color="bg-red-50 text-red-500 border border-red-100" />
                    </div>

                    {/* Property Image / Info */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-4">Property Information</h3>
                        <div className="w-full h-40 rounded-2xl bg-gray-100 mb-4 overflow-hidden relative group">
                            <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400" alt="Building" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute bottom-3 left-3 text-white">
                                <p className="text-xs font-black uppercase tracking-widest">Building A</p>
                                <p className="text-[10px] font-bold opacity-80">Main Wing • Level 2</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 px-1">
                            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                                <span>Unit / Bedroom</span>
                                <span className="text-indigo-600">82-101-2</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                                <span>Unit Type</span>
                                <span className="text-gray-500">2 Bed / 1 Bath</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                                <span>Address</span>
                                <span className="text-gray-500 text-right">123 Main St,<br/>Anytown, CA 90210</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex-1">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-6">Activity Timeline</h3>
                        <div className="flex flex-col gap-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-50">
                            <TimelineEvent icon={CheckCircle2} color="bg-green-500" label="Inspection created" time="Jun 20, 2025 10:15 AM" />
                            <TimelineEvent icon={PlayCircle} color="bg-blue-500" label="Inspection started" time="Jun 20, 2025 10:30 AM" />
                            <TimelineEvent icon={ImageIcon} color="bg-purple-500" label="Photos added (12)" time="Jun 20, 2025 11:45 AM" />
                            <TimelineEvent icon={MessageSquare} color="bg-orange-500" label="Notes added (3)" time="Jun 20, 2025 2:45 PM" />
                        </div>
                        <button className="w-full mt-8 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">View Full History</button>
                    </div>

                </div>
            </div>
            </div>
        </MainLayout>
    );
};

const Tab = ({ label, active, icon: Icon, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-2 py-3 border-b-2 transition-all text-xs font-black uppercase tracking-widest
        ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
    >
        <Icon size={14} />
        {label}
    </button>
);

const DetailRow = ({ label, value, status, icon: Icon }) => (
    <div className="flex items-center justify-between group">
        <span className="text-xs font-bold text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className="text-gray-300" />}
            <span className={`text-xs font-black transition-all ${
                status === 'blue' ? 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100' : 
                status === 'orange' ? 'text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100' : 
                'text-gray-900'
            }`}>{value}</span>
        </div>
    </div>
);

const ProgressItem = ({ label, value, color }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-xs font-black text-gray-900">{value}</span>
    </div>
);

const TicketStat = ({ icon: Icon, label, value, color }) => (
    <div className={`p-4 rounded-2xl border border-transparent hover:border-gray-100 transition-all flex items-center justify-between ${color}`}>
        <div className="flex items-center gap-3">
            <Icon size={20} />
            <span className="text-xs font-black uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-xl font-black">{value}</span>
    </div>
);

const QuickAction = ({ icon: Icon, label, color }) => (
    <button className={`w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm hover:shadow-lg ${color}`}>
        <Icon size={18} />
        {label}
    </button>
);

const TimelineEvent = ({ icon: Icon, color, label, time }) => (
    <div className="flex items-start gap-4 relative z-10">
        <div className={`w-6 h-6 rounded-full ${color} text-white flex items-center justify-center shadow-lg shadow-${color}/20`}>
            <Icon size={12} />
        </div>
        <div className="flex flex-col gap-0.5">
            <span className="text-xs font-black text-gray-900 leading-none">{label}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{time}</span>
        </div>
    </div>
);

const PlayCircle = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" />
  </svg>
)

export default InspectionOverview;
