import React, { useState, useEffect, useRef } from 'react';
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
    MoreHorizontal,
    Edit3,
    Trash2,
    Loader2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';

import api from '../../api/client';

const InspectionForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [inspection, setInspection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState({});
    const [tickets, setTickets] = useState([]);
    const [signature, setSignature] = useState('');
    const [noDeficiency, setNoDeficiency] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [ticketLoading, setTicketLoading] = useState({});

    // Signature Canvas
    const signatureCanvasRef = useRef(null);
    const isDrawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    // Refs for scrolling to sections
    const sectionRefs = useRef({});

    useEffect(() => {
        fetchInspection();
    }, [id]);

    const fetchInspection = async () => {
        try {
            const res = await api.get(`/api/admin/workflow/inspections/${id}`);
            if (res.data.success) {
                const data = res.data.data;
                setInspection(data);
                setSignature(data.tenantSignature || '');
                setNoDeficiency(data.noDeficiencyConfirmed || false);
                setIsEditMode(data.status === 'DRAFT');
                setTickets(data.tickets || []);

                // Pre-fill responses - Match by question text since DB doesn't store questionId
                const initialResponses = {};
                const templateRooms = data.template?.structure?.rooms || [];
                
                data.responses?.forEach(r => {
                    // Find the question ID from the template structure that matches this response's question text
                    let matchedQId = r.id; // Fallback
                    for (const room of templateRooms) {
                        const q = room.questions?.find(q => q.text === r.question);
                        if (q) {
                            matchedQId = q.id;
                            break;
                        }
                    }

                    initialResponses[matchedQId] = {
                        id: r.id,
                        status: r.response,
                        notes: r.notes,
                        annotation: r.annotation,
                        photo: r.photoUrl || r.media?.[0]?.url
                    };
                });
                setResponses(initialResponses);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-black text-gray-400 tracking-widest animate-pulse">LOADING INSPECTION DATA...</div>;
    if (!inspection) return <div className="p-20 text-center font-black text-red-400 tracking-widest">INSPECTION NOT FOUND</div>;

    const rooms = inspection.template?.structure?.rooms || [];

    const handleConditionChange = (questionId, status) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], status }
        }));
    };

    const handleNoteChange = (questionId, notes) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], notes }
        }));
    };

    const handleAnnotationChange = (questionId, annotation) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], annotation }
        }));
    };

    const handlePhotoUpload = (questionId, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setResponses(prev => ({
                ...prev,
                [questionId]: { ...prev[questionId], photo: reader.result }
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleCreateTicket = async (question) => {
        try {
            setTicketLoading(prev => ({ ...prev, [question.id]: true }));
            const res = await api.post(`/api/admin/workflow/inspections/${id}/tickets`, {
                questionId: question.id,
                questionText: question.text,
                notes: responses[question.id]?.notes || 'No notes provided'
            });
            if (res.data.success) {
                const newTicket = res.data.data;
                setResponses(prev => ({
                    ...prev,
                    [question.id]: { ...prev[question.id], ticketCreated: true, ticketId: newTicket.id }
                }));
                setTickets(prev => [...prev, newTicket]);
                alert('Deficiency Ticket Created Successfully!');
            }
        } catch (error) {
            console.error('Ticket creation error:', error);
            alert('Failed to create ticket: ' + (error.response?.data?.message || error.message));
        } finally {
            setTicketLoading(prev => ({ ...prev, [question.id]: false }));
        }
    };

    const handleDeleteTicket = async (questionId, ticketId) => {
        if (!window.confirm('Are you sure you want to delete this ticket?')) return;
        try {
            const res = await api.delete(`/api/admin/workflow/inspections/${id}/tickets/${ticketId}`);
            if (res.data.success) {
                // Update responses state to clear the ticket link
                setResponses(prev => ({
                    ...prev,
                    [questionId]: { ...prev[questionId], ticketCreated: false, ticketId: null }
                }));
                // Update tickets list
                setTickets(prev => prev.filter(t => t.id !== ticketId));
                alert('Ticket deleted successfully.');
            }
        } catch (error) {
            console.error('Ticket deletion error:', error);
            alert('Failed to delete ticket.');
        }
    };

    const validateForm = () => {
        // Check if all questions in all rooms have a status
        for (const room of rooms) {
            for (const q of room.questions) {
                if (!responses[q.id]?.status) {
                    alert(`Please review "${q.text}" in ${room.name}.`);
                    sectionRefs.current[room.id]?.scrollIntoView({ behavior: 'smooth' });
                    return false;
                }
            }
        }
        if (!signature && !noDeficiency) {
            alert('Please provide a signature or confirm "No Deficiencies".');
            return false;
        }
        return true;
    };

    const handleFinalize = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            const formattedResponses = Object.keys(responses).map(qId => {
                const room = rooms.find(r => r.questions.some(q => q.id.toString() === qId));
                const question = room?.questions.find(q => q.id.toString() === qId);
                return {
                    id: responses[qId].id,
                    questionId: parseInt(qId),
                    question: question?.text || 'Unknown',
                    response: responses[qId].status,
                    notes: responses[qId].notes || '',
                    annotation: responses[qId].annotation || '',
                    photo: responses[qId].photo || null
                };
            });

            const payload = {
                responses: formattedResponses,
                signature,
                noDeficiencyConfirmed: noDeficiency
            };

            const endpoint = inspection.status === 'COMPLETED' 
                ? `/api/admin/workflow/inspections/${id}` 
                : `/api/admin/workflow/inspections/${id}/submit`;
            
            const method = inspection.status === 'COMPLETED' ? 'put' : 'post';

            const res = await api[method](endpoint, payload);

            if (res.data.success) {
                alert(inspection.status === 'COMPLETED' ? 'Changes saved with audit log.' : 'Inspection Finalized Successfully!');
                navigate('/admin/workflow/move-in');
            }
        } catch (error) {
            console.error('Finalize error:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const scrollToSection = (roomId) => {
        sectionRefs.current[roomId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // ── Signature Canvas helpers ──────────────────────────────────
    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const src = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * scaleX,
            y: (src.clientY - rect.top)  * scaleY
        };
    };

    const startDraw = (e) => {
        if (!isEditMode && inspection.status !== 'DRAFT') return;
        e.preventDefault();
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        isDrawing.current = true;
        lastPos.current = getPos(e, canvas);
    };

    const draw = (e) => {
        if (!isDrawing.current) return;
        e.preventDefault();
        const canvas = signatureCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e, canvas);
        ctx.strokeStyle = '#1e1b4b';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPos.current = pos;
    };

    const stopDraw = (e) => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        // Save canvas data as base64 string
        const canvas = signatureCanvasRef.current;
        setSignature(canvas.toDataURL('image/png'));
    };

    const clearSignature = () => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        setSignature('');
    };

    return (
        <MainLayout title="Professional Inspection">
            <div className="flex bg-gray-50/50 min-h-screen">
                {/* Fixed Sidebar Navigation */}
                <div className="w-72 bg-white border-r border-gray-100 p-8 flex flex-col gap-8 sticky top-0 h-screen overflow-y-auto hidden lg:flex">
                    <div>
                        <button onClick={() => navigate(-1)} className="text-indigo-600 font-black text-[10px] uppercase flex items-center gap-2 mb-6 hover:gap-3 transition-all">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </button>
                        <h2 className="text-xl font-black text-gray-900 tracking-tighter mb-1">Navigation</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jump to Section</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        {rooms.map((room, idx) => (
                            <button
                                key={room.id}
                                onClick={() => scrollToSection(room.id)}
                                className="flex items-center justify-between group p-3 rounded-2xl hover:bg-indigo-50 transition-all text-left border border-transparent hover:border-indigo-100"
                            >
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-300 uppercase group-hover:text-indigo-400">Section {idx + 1}</span>
                                    <span className="text-sm font-black text-gray-600 group-hover:text-indigo-900 tracking-tight">{room.name}</span>
                                </div>
                                <ChevronRight size={16} className="text-gray-200 group-hover:text-indigo-300" />
                            </button>
                        ))}
                        <button
                            onClick={() => scrollToSection('finalize')}
                            className="flex items-center justify-between group p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 mt-4"
                        >
                            <span className="text-sm font-black tracking-tight">Finalize & Sign</span>
                            <CheckCircle2 size={16} />
                        </button>
                    </div>

                    <div className="mt-auto p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={14} className="text-orange-500" />
                            <span className="text-[10px] font-black text-gray-900 uppercase">Status</span>
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest ${inspection.status === 'COMPLETED' ? 'text-green-600' : 'text-indigo-600'}`}>
                            {inspection.status}
                        </span>
                    </div>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
                    <div className="max-w-5xl mx-auto">
                        {/* Header Area */}
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Inspection Record</h1>
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</span>
                                        <span className="text-sm font-black text-gray-700">{inspection.template?.type}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit</span>
                                        <span className="text-sm font-black text-gray-700">{inspection.unit?.unitNumber}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</span>
                                        <span className="text-sm font-black text-gray-700">{new Date(inspection.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {inspection.status === 'COMPLETED' && !isEditMode && (
                                <button 
                                    onClick={() => setIsEditMode(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <Edit3 size={16} /> Enter Edit Mode (Audited)
                                </button>
                            )}
                        </div>

                        {/* Long Scroll Form */}
                        <div className="flex flex-col gap-12">
                            {rooms.map((room, idx) => (
                                <section 
                                    key={room.id} 
                                    ref={el => sectionRefs.current[room.id] = el}
                                    className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden scroll-mt-8"
                                >
                                    <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{idx + 1}. {room.name}</h2>
                                            <p className="text-gray-500 text-sm font-medium">Detailed condition report for {room.name.toLowerCase()}.</p>
                                        </div>
                                        <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                            <span className="text-indigo-600">{room.questions?.length || 0}</span> Items
                                        </div>
                                    </div>

                                    <div className="p-0 overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[1000px]">
                                            <thead>
                                                <tr className="bg-white border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                                    <th className="px-8 py-5 w-[250px]">Item / Question</th>
                                                    <th className="px-8 py-5 w-[150px]">Condition</th>
                                                    <th className="px-8 py-5 w-[220px]">Photos & Annotation</th>
                                                    <th className="px-8 py-5">Notes</th>
                                                    <th className="px-8 py-5 w-[160px]">Ticket</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {room.questions?.map((q) => (
                                                    <tr key={q.id} className="hover:bg-gray-50/30 transition-colors group">
                                                        <td className="px-8 py-6 align-top">
                                                            <h4 className="font-black text-gray-900 text-base mb-1">{q.text}</h4>
                                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Operational Check</span>
                                                        </td>
                                                        <td className="px-8 py-6 align-top">
                                                            <div className="flex flex-col gap-2">
                                                                {q.type === 'DROPDOWN' ? (
                                                                    <select
                                                                        value={responses[q.id]?.status || ''}
                                                                        disabled={!isEditMode && inspection.status !== 'DRAFT'}
                                                                        onChange={(e) => handleConditionChange(q.id, e.target.value)}
                                                                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                                    >
                                                                        <option value="">Select Option...</option>
                                                                        {(q.options || '').split(',').map(opt => (
                                                                            <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : q.type === 'TEXT' ? (
                                                                    <textarea 
                                                                        placeholder="Enter response..."
                                                                        value={responses[q.id]?.status || ''}
                                                                        readOnly={!isEditMode && inspection.status !== 'DRAFT'}
                                                                        onChange={(e) => handleConditionChange(q.id, e.target.value)}
                                                                        className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold"
                                                                    />
                                                                ) : q.type === 'RATING' ? (
                                                                    <div className="flex gap-1">
                                                                        {[1,2,3,4,5].map(num => (
                                                                            <button 
                                                                                key={num}
                                                                                onClick={() => (isEditMode || inspection.status === 'DRAFT') && handleConditionChange(q.id, num.toString())}
                                                                                className={`w-8 h-8 rounded-lg text-xs font-black ${responses[q.id]?.status === num.toString() ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                                                                            >
                                                                                {num}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                ) : q.type === 'YES_NO' ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        {['Yes', 'No'].map(choice => (
                                                                            <ConditionToggle
                                                                                key={choice}
                                                                                label={choice}
                                                                                active={responses[q.id]?.status === choice}
                                                                                color={choice === 'Yes' ? 'text-green-600' : 'text-red-600'}
                                                                                dot={choice === 'Yes' ? 'bg-green-500' : 'bg-red-500'}
                                                                                onClick={() => (isEditMode || inspection.status === 'DRAFT') && handleConditionChange(q.id, choice)}
                                                                                disabled={!isEditMode && inspection.status !== 'DRAFT'}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col gap-2">
                                                                        {(inspection.template?.structure?.responseChoices || [
                                                                            { label: 'Good', color: 'green' },
                                                                            { label: 'Fair', color: 'orange' },
                                                                            { label: 'Poor', color: 'red' }
                                                                        ]).map(choice => (
                                                                            <ConditionToggle
                                                                                key={choice.label}
                                                                                label={choice.label}
                                                                                active={responses[q.id]?.status === choice.label}
                                                                                color={`text-${choice.color}-600`}
                                                                                dot={`bg-${choice.color}-500`}
                                                                                onClick={() => (isEditMode || inspection.status === 'DRAFT') && handleConditionChange(q.id, choice.label)}
                                                                                disabled={!isEditMode && inspection.status !== 'DRAFT'}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 align-top">
                                                            <div className="flex flex-col gap-3">
                                                                <div className="w-full h-32 rounded-3xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200 group-hover:border-indigo-200 transition-all relative overflow-hidden">
                                                                    {responses[q.id]?.photo ? (
                                                                        <img src={responses[q.id].photo} className="w-full h-full object-cover" alt="Captured" />
                                                                    ) : (
                                                                        <Camera size={24} className="text-gray-300 group-hover:text-indigo-400" />
                                                                    )}
                                                                    {(isEditMode || inspection.status === 'DRAFT') && (
                                                                        <input 
                                                                            type="file" 
                                                                            accept="image/*"
                                                                            capture="environment"
                                                                            onChange={(e) => handlePhotoUpload(q.id, e.target.files[0])}
                                                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                                                        />
                                                                    )}
                                                                </div>
                                                                {responses[q.id]?.photo && (
                                                                    <input 
                                                                        type="text"
                                                                        placeholder="Add photo annotation..."
                                                                        value={responses[q.id]?.annotation || ''}
                                                                        readOnly={!isEditMode && inspection.status !== 'DRAFT'}
                                                                        onChange={(e) => handleAnnotationChange(q.id, e.target.value)}
                                                                        className="text-[10px] font-bold p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                                    />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 align-top">
                                                            <textarea
                                                                placeholder="Add line item notes..."
                                                                value={responses[q.id]?.notes || ''}
                                                                readOnly={!isEditMode && inspection.status !== 'DRAFT'}
                                                                onChange={(e) => handleNoteChange(q.id, e.target.value)}
                                                                className="w-full px-4 py-4 bg-gray-50 border border-transparent hover:border-gray-100 rounded-3xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[120px] resize-none shadow-inner"
                                                            />
                                                        </td>
                                                        <td className="px-8 py-6 align-top">
                                                            {responses[q.id]?.ticketCreated ? (
                                                                <div className="flex items-center justify-between gap-2 text-green-600 font-black text-[10px] uppercase bg-green-50 p-3 rounded-xl border border-green-100">
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckCircle2 size={14} /> Ticket Created
                                                                    </div>
                                                                    {(isEditMode || inspection.status === 'DRAFT') && (
                                                                        <button 
                                                                            onClick={() => handleDeleteTicket(q.id, responses[q.id].ticketId)}
                                                                            className="text-red-400 hover:text-red-600 transition-colors"
                                                                            title="Delete Ticket"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleCreateTicket(q)}
                                                                    disabled={ticketLoading[q.id] || (!isEditMode && inspection.status !== 'DRAFT')}
                                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-[10px] font-black text-gray-600 uppercase hover:bg-white border border-transparent hover:border-gray-200 transition-all shadow-sm group/btn disabled:opacity-50"
                                                                >
                                                                    {ticketLoading[q.id] ? (
                                                                        <Loader2 size={14} className="animate-spin" />
                                                                    ) : (
                                                                        <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
                                                                    )}
                                                                    {ticketLoading[q.id] ? 'Creating...' : 'Create Ticket'}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            ))}

                            {/* Ticket Summary Section */}
                            {tickets.length > 0 && (
                                <section className="bg-orange-50/50 rounded-[40px] border border-orange-100 p-10 mt-12 mb-12">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-2xl font-black text-orange-900 tracking-tight flex items-center gap-3">
                                            <AlertCircle size={28} /> Deficiency Summary ({tickets.length})
                                        </h3>
                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-lg">Tickets Created</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {tickets.map(t => (
                                            <div key={t.id} className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-3 group/ticket hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-2">
                                                        <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{t.category}</span>
                                                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{t.priority}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-black text-gray-300 uppercase">#{t.id}</span>
                                                        {(isEditMode || inspection.status === 'DRAFT') && (
                                                            <button 
                                                                onClick={() => {
                                                                    const qId = Object.keys(responses).find(key => responses[key].ticketId === t.id);
                                                                    handleDeleteTicket(qId, t.id);
                                                                }}
                                                                className="text-red-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <h4 className="font-black text-gray-900 tracking-tight text-lg">{t.subject}</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed">{t.description}</p>
                                                <div className="mt-2 flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                                                    <Clock size={12} />
                                                    Created {new Date(t.createdAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Finalize & Signature Section */}
                            <section 
                                ref={el => sectionRefs.current['finalize'] = el}
                                className="max-w-4xl mx-auto bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden mb-20 scroll-mt-8"
                            >
                                <div className="p-10 text-center border-b border-gray-50">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Final Confirmation</h2>
                                    <p className="text-gray-500 font-medium">By signing, you confirm the recorded condition is accurate and legally binding.</p>
                                </div>
                                
                                <div className="p-10 flex flex-col gap-8">
                                    <div className="flex items-center gap-4 p-8 bg-indigo-50 rounded-[32px] border border-indigo-100">
                                        <input 
                                            type="checkbox" 
                                            id="noDeficiency" 
                                            checked={noDeficiency}
                                            disabled={!isEditMode && inspection.status !== 'DRAFT'}
                                            onChange={(e) => setNoDeficiency(e.target.checked)}
                                            className="w-8 h-8 rounded-xl text-indigo-600 focus:ring-indigo-500 border-indigo-200"
                                        />
                                        <label htmlFor="noDeficiency" className="text-sm font-black text-indigo-900 uppercase tracking-tight cursor-pointer">
                                            I explicitly confirm there are no significant deficiencies found during this handover.
                                        </label>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between px-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tenant Signature</label>
                                            {(isEditMode || inspection.status === 'DRAFT') && (
                                                <button
                                                    onClick={clearSignature}
                                                    className="flex items-center gap-1.5 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
                                                >
                                                    <X size={12} /> Clear
                                                </button>
                                            )}
                                        </div>

                                        <div className="relative rounded-[32px] border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden group hover:border-indigo-300 transition-colors">
                                            {/* Guide text shown when empty */}
                                            {!signature && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
                                                        <Save size={28} className="text-gray-200" />
                                                    </div>
                                                    <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Draw signature here</p>
                                                    <p className="text-[10px] text-gray-300 mt-1">Use finger on tablet · mouse on desktop</p>
                                                </div>
                                            )}

                                            {/* If completed and has saved signature (base64 or text) show preview */}
                                            {signature && !signature.startsWith('data:image') && (
                                                <div className="h-48 flex items-center justify-center bg-white">
                                                    <span className="text-5xl font-serif italic text-gray-800 tracking-tighter select-none">{signature}</span>
                                                </div>
                                            )}

                                            {/* Canvas — always rendered so ref works; hidden when showing old text sig */}
                                            <canvas
                                                ref={signatureCanvasRef}
                                                width={1200}
                                                height={300}
                                                onMouseDown={startDraw}
                                                onMouseMove={draw}
                                                onMouseUp={stopDraw}
                                                onMouseLeave={stopDraw}
                                                onTouchStart={startDraw}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDraw}
                                                style={{
                                                    display: signature && !signature.startsWith('data:image') ? 'none' : 'block',
                                                    touchAction: 'none',
                                                    cursor: (isEditMode || inspection.status === 'DRAFT') ? 'crosshair' : 'default'
                                                }}
                                                className="w-full h-48 rounded-[30px]"
                                            />
                                        </div>

                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center">
                                            By signing above, you confirm the recorded condition is accurate and legally binding.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 mt-6">
                                        <button 
                                            onClick={handleFinalize}
                                            disabled={saving || (!isEditMode && inspection.status === 'COMPLETED')}
                                            className={`flex-1 py-5 rounded-[24px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3
                                                ${(saving || (!isEditMode && inspection.status === 'COMPLETED')) ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 active:scale-[0.98]'}`}
                                        >
                                            {saving ? 'Saving...' : inspection.status === 'COMPLETED' ? 'Save Changes (Logged)' : 'Finalize & Close Inspection'}
                                            <CheckCircle2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

const ConditionToggle = ({ label, active, color, dot, onClick, disabled }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`flex items-center gap-3 p-2 rounded-xl transition-all text-left ${disabled ? 'cursor-default' : 'hover:bg-white active:scale-95'}`}
    >
        <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center
            ${active ? `border-indigo-600 bg-indigo-50` : 'border-gray-200'}`}>
            {active && <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />}
        </div>
        <span className={`text-[11px] font-black tracking-widest uppercase transition-all
            ${active ? color : 'text-gray-400'}`}>{label}</span>
    </button>
);

export default InspectionForm;
