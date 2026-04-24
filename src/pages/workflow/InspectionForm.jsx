import React, { useState, useEffect } from 'react';
import {
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    Camera,
    AlertCircle,
    Clock,
    MoreVertical,
    Download,
    Save,
    Plus,
    X,
    MoreHorizontal
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';

import api from '../../api/client';

const InspectionForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [inspection, setInspection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState(0);
    const [responses, setResponses] = useState({});

    useEffect(() => {
        fetchInspection();
    }, [id]);

    const fetchInspection = async () => {
        try {
            const res = await api.get(`/api/admin/workflow/inspections/${id}`);
            if (res.data.success) {
                setInspection(res.data.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-black text-gray-400 tracking-widest">LOADING INSPECTION FORM...</div>;
    if (!inspection) return <div className="p-20 text-center font-black text-red-400 tracking-widest">INSPECTION NOT FOUND</div>;

    const rooms = inspection.template?.structure?.rooms || [];
    const currentRoom = rooms[activeSection];

    const handleConditionChange = (questionId, status) => {
        setResponses({
            ...responses,
            [questionId]: { ...responses[questionId], status }
        });
    };

    const handleNoteChange = (questionId, notes) => {
        setResponses({
            ...responses,
            [questionId]: { ...responses[questionId], notes }
        });
    };

    const handlePhotoUpload = (questionId, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setResponses({
                ...responses,
                [questionId]: { ...responses[questionId], photo: reader.result }
            });
        };
        reader.readAsDataURL(file);
    };

    const handleCreateTicket = async (question) => {
        try {
            const res = await api.post(`/api/admin/workflow/inspections/${id}/tickets`, {
                questionId: question.id,
                questionText: question.text,
                notes: responses[question.id]?.notes || 'No notes provided'
            });
            if (res.data.success) {
                setResponses({
                    ...responses,
                    [question.id]: { ...responses[question.id], ticketCreated: true }
                });
                alert('Deficiency Ticket Created Successfully!');
            }
        } catch (error) {
            console.error('Ticket creation error:', error);
            alert('Failed to create ticket. Please try again.');
        }
    };

    return (
        <MainLayout title="Inspection Form">
            <div className="p-0 bg-transparent min-h-screen">
                {/* Sub-Header / Breadcrumb */}
                <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="text-indigo-600 font-black text-xs uppercase flex items-center gap-2 hover:gap-3 transition-all">
                            <ArrowLeft size={16} />
                            Back to Inspection
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Inspection Form</h1>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase border border-blue-100">{inspection.status}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-6 py-2.5 bg-white text-gray-600 rounded-2xl text-sm font-black border border-gray-100 hover:bg-gray-50 transition-colors shadow-sm">
                            Save as Draft
                        </button>
                        <button
                            onClick={() => activeSection < rooms.length - 1 && setActiveSection(activeSection + 1)}
                            className="px-8 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                        >
                            {activeSection === rooms.length - 1 ? 'Finalize' : 'Next Section'}
                        </button>
                    </div>
                </div>

                {/* Context Info Bar */}
                <div className="max-w-6xl mx-auto grid grid-cols-5 gap-8 mb-10 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <div className="flex flex-col gap-1">
                        <span>{inspection.template?.type} Inspection</span>
                        <span className="text-gray-900">{inspection.template?.name}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span>Unit / Bedroom</span>
                        <span className="text-gray-900">{inspection.unit?.unit_number}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span>Tenant</span>
                        <span className="text-gray-900">{inspection.lease?.tenant?.name || 'Prospect/Reserved'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span>Inspector</span>
                        <span className="text-gray-900">{inspection.inspector?.name}</span>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-indigo-600">Progress</span>
                            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="w-[35%] h-full bg-indigo-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Stepper */}
                <div className="max-w-6xl mx-auto flex items-center gap-2 mb-12 overflow-x-auto pb-4 scrollbar-none">
                    {rooms.map((room, idx) => (
                        <button
                            key={room.id}
                            onClick={() => setActiveSection(idx)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border
                        ${activeSection === idx ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 scale-105' :
                                    'bg-white text-gray-400 border-gray-100 hover:border-indigo-100'}`}
                        >
                            <span className="opacity-50">{idx + 1}.</span>
                            {room.name}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                {currentRoom && (
                    <div className="max-w-6xl mx-auto bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{activeSection + 1}. {currentRoom.name}</h2>
                                <p className="text-gray-500 text-sm font-medium">Verify the condition of items in the {currentRoom.name.toLowerCase()} area.</p>
                            </div>
                            <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                <span className="text-indigo-600">{currentRoom.questions?.length || 0}</span> Items
                            </div>
                        </div>

                        <div className="p-0">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-8 py-5 w-[300px]">Item / Question</th>
                                        <th className="px-8 py-5">Condition</th>
                                        <th className="px-8 py-5">Photos</th>
                                        <th className="px-8 py-5">Notes</th>
                                        <th className="px-8 py-5">Ticket</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {currentRoom.questions?.map((q) => (
                                        <tr key={q.id} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-8 py-6 align-top">
                                                <h4 className="font-black text-gray-900 text-base mb-1">{q.text}</h4>
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Required Check</span>
                                            </td>
                                            <td className="px-8 py-6 align-top">
                                                <div className="flex flex-col gap-2">
                                                    <ConditionToggle
                                                        label="Good"
                                                        active={responses[q.id]?.status === 'Good'}
                                                        color="text-green-600"
                                                        dot="bg-green-500"
                                                        onClick={() => handleConditionChange(q.id, 'Good')}
                                                    />
                                                    <ConditionToggle
                                                        label="Fair"
                                                        active={responses[q.id]?.status === 'Fair'}
                                                        color="text-orange-600"
                                                        dot="bg-orange-500"
                                                        onClick={() => handleConditionChange(q.id, 'Fair')}
                                                    />
                                                    <ConditionToggle
                                                        label="Poor"
                                                        active={responses[q.id]?.status === 'Poor'}
                                                        color="text-red-600"
                                                        dot="bg-red-500"
                                                        onClick={() => handleConditionChange(q.id, 'Poor')}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 align-top">
                                                <div className="flex flex-col gap-3">
                                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200 group-hover:border-indigo-200 transition-all relative overflow-hidden">
                                                        {responses[q.id]?.photo ? (
                                                            <img src={responses[q.id].photo} className="w-full h-full object-cover" alt="Captured" />
                                                        ) : (
                                                            <Camera size={20} className="text-gray-300 group-hover:text-indigo-400" />
                                                        )}
                                                        <input 
                                                            type="file" 
                                                            accept="image/*"
                                                            capture="environment"
                                                            onChange={(e) => handlePhotoUpload(q.id, e.target.files[0])}
                                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                                        />
                                                    </div>
                                                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline text-left">
                                                        {responses[q.id]?.photo ? 'Change Photo' : 'Add Photo'}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 align-top">
                                                <textarea
                                                    placeholder="Add notes..."
                                                    onChange={(e) => handleNoteChange(q.id, e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-transparent hover:border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[80px] resize-none shadow-inner"
                                                />
                                            </td>
                                            <td className="px-8 py-6 align-top">
                                                {responses[q.id]?.ticketCreated ? (
                                                    <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase">
                                                        <CheckCircle2 size={14} />
                                                        Ticket Created
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleCreateTicket(q)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black text-gray-600 uppercase hover:bg-white border border-transparent hover:border-gray-200 transition-all shadow-sm"
                                                    >
                                                        <Plus size={14} />
                                                        Create Ticket
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-sm font-black text-gray-900 tracking-tight">Additional Notes ({currentRoom.name})</h3>
                                <p className="text-xs text-gray-400">Add any final thoughts for this section.</p>
                            </div>
                            <textarea
                                placeholder={`General notes for ${currentRoom.name}...`}
                                className="w-2/3 px-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[60px] resize-none shadow-sm"
                            />
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

const ConditionToggle = ({ label, active, color, dot, onClick }) => (
    <div onClick={onClick} className={`flex items-center gap-2 cursor-pointer group`}>
        <div className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center
            ${active ? `border-indigo-600` : 'border-gray-200 group-hover:border-indigo-300'}`}>
            {active && <div className={`w-2 h-2 rounded-full ${dot}`} />}
        </div>
        <span className={`text-[11px] font-black tracking-widest uppercase transition-all
            ${active ? color : 'text-gray-400 group-hover:text-gray-600'}`}>{label}</span>
    </div>
);

export default InspectionForm;
