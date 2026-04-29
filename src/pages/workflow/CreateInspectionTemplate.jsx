import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Plus, 
    Trash2, 
    ChevronLeft, 
    Save, 
    Layout, 
    GripVertical,
    PlusCircle
} from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import api from '../../api/client';

const CreateInspectionTemplate = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'MOVE_OUT',
        responseChoices: [
            { label: 'Good', color: 'green' },
            { label: 'Fair', color: 'orange' },
            { label: 'Poor', color: 'red' }
        ],
        rooms: [
            { 
                id: Date.now(), 
                name: 'Kitchen', 
                questions: [
                    { id: Date.now() + 1, text: 'Is the countertop clean?', type: 'GLOBAL' }
                ] 
            }
        ]
    });

    useEffect(() => {
        if (id) {
            fetchTemplate();
        }
    }, [id]);

    const fetchTemplate = async () => {
        try {
            const res = await api.get('/api/admin/workflow/templates');
            if (res.data.success) {
                const template = res.data.data.find(t => t.id === parseInt(id));
                if (template) {
                    setFormData({
                        name: template.name,
                        type: template.type,
                        responseChoices: template.structure?.responseChoices || [
                            { label: 'Good', color: 'green' },
                            { label: 'Fair', color: 'orange' },
                            { label: 'Poor', color: 'red' }
                        ],
                        rooms: template.structure?.rooms || []
                    });
                }
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const addRoom = () => {
        setFormData({
            ...formData,
            rooms: [...formData.rooms, { id: Date.now(), name: 'New Room', questions: [] }]
        });
    };

    const removeRoom = (roomId) => {
        setFormData({
            ...formData,
            rooms: formData.rooms.filter(r => r.id !== roomId)
        });
    };

    const addQuestion = (roomId) => {
        setFormData({
            ...formData,
            rooms: formData.rooms.map(r => 
                r.id === roomId 
                ? { ...r, questions: [...r.questions, { id: Date.now(), text: '', type: 'GLOBAL' }] }
                : r
            )
        });
    };

    const updateQuestion = (roomId, questionId, text) => {
        setFormData({
            ...formData,
            rooms: formData.rooms.map(r => 
                r.id === roomId 
                ? { ...r, questions: r.questions.map(q => q.id === questionId ? { ...q, text } : q) }
                : r
            )
        });
    };

    const removeQuestion = (roomId, questionId) => {
        setFormData({
            ...formData,
            rooms: formData.rooms.map(r => 
                r.id === roomId 
                ? { ...r, questions: r.questions.filter(q => q.id !== questionId) }
                : r
            )
        });
    };

    const handleSave = async () => {
        if (!formData.name) return alert('Please enter a template name');
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                type: formData.type,
                structure: { 
                    rooms: formData.rooms,
                    responseChoices: formData.responseChoices
                }
            };
            
            const res = id 
                ? await api.put(`/api/admin/workflow/templates/${id}`, payload)
                : await api.post('/api/admin/workflow/templates', payload);

            if (res.data.success) {
                navigate('/admin/workflow/templates');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout title="Create Template">
            <div className="max-w-4xl mx-auto py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <ChevronLeft size={24} className="text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{id ? 'Edit Template' : 'New Template'}</h1>
                            <p className="text-gray-500 text-sm font-medium">{id ? 'Update your existing checklist' : 'Design your room-by-room inspection checklist'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : <><Save size={18} /> Save Template</>}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Basic Info */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Template Name</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g., Standard Move-Out Checklist"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Inspection Type</label>
                                <select 
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                >
                                    <option value="MOVE_IN">Move-In Inspection</option>
                                    <option value="MOVE_OUT">Move-Out Inspection</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Response Options (e.g. Yes/No or Good/Fair/Poor)</label>
                            <div className="flex flex-wrap gap-3">
                                {formData.responseChoices.map((choice, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 group">
                                        <div className={`w-3 h-3 rounded-full bg-${choice.color}-500`} />
                                        <input 
                                            className="bg-transparent text-xs font-black outline-none w-16"
                                            value={choice.label}
                                            onChange={(e) => {
                                                const newChoices = [...formData.responseChoices];
                                                newChoices[idx].label = e.target.value;
                                                setFormData({ ...formData, responseChoices: newChoices });
                                            }}
                                        />
                                        <select 
                                            className="text-[9px] font-bold bg-white rounded border border-gray-100 outline-none"
                                            value={choice.color}
                                            onChange={(e) => {
                                                const newChoices = [...formData.responseChoices];
                                                newChoices[idx].color = e.target.value;
                                                setFormData({ ...formData, responseChoices: newChoices });
                                            }}
                                        >
                                            <option value="green">Green</option>
                                            <option value="orange">Orange</option>
                                            <option value="red">Red</option>
                                            <option value="blue">Blue</option>
                                            <option value="gray">Gray</option>
                                        </select>
                                        <button 
                                            onClick={() => setFormData({ ...formData, responseChoices: formData.responseChoices.filter((_, i) => i !== idx) })}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setFormData({ ...formData, responseChoices: [...formData.responseChoices, { label: 'New', color: 'gray' }] })}
                                    className="px-3 py-2 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                                >
                                    + Add Choice
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Room Sections */}
                    <div className="space-y-4">
                        {formData.rooms.map((room, index) => (
                            <div key={room.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
                                <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center shadow-sm">
                                            <span className="text-xs font-black text-indigo-600">{index + 1}</span>
                                        </div>
                                        <input 
                                            type="text"
                                            value={room.name}
                                            onChange={(e) => {
                                                const newRooms = [...formData.rooms];
                                                newRooms[index].name = e.target.value;
                                                setFormData({ ...formData, rooms: newRooms });
                                            }}
                                            className="bg-transparent text-lg font-black text-gray-900 outline-none border-b-2 border-transparent focus:border-indigo-500 transition-all px-1"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => removeRoom(room.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-3">
                                    {room.questions.map((q, qIndex) => (
                                        <div key={q.id} className="flex items-center gap-3 group/item">
                                            <GripVertical size={16} className="text-gray-300 cursor-grab active:cursor-grabbing" />
                                            <input 
                                                type="text"
                                                value={q.text}
                                                onChange={(e) => updateQuestion(room.id, q.id, e.target.value)}
                                                placeholder="Enter inspection question..."
                                                className="flex-1 px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-gray-200 transition-all"
                                            />
                                            <div className="flex flex-col gap-2 min-w-[150px]">
                                                <select 
                                                    value={q.type}
                                                    onChange={(e) => {
                                                        const newRooms = [...formData.rooms];
                                                        newRooms[index].questions[qIndex].type = e.target.value;
                                                        setFormData({ ...formData, rooms: newRooms });
                                                    }}
                                                    className="px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-black text-gray-500 outline-none w-full"
                                                >
                                                    <option value="GLOBAL">Template Buttons</option>
                                                    <option value="YES_NO">YES/NO (Standard)</option>
                                                    <option value="DROPDOWN">Custom Dropdown</option>
                                                    <option value="TEXT">Text Input</option>
                                                    <option value="RATING">1-5 Rating</option>
                                                </select>
                                                {q.type === 'DROPDOWN' && (
                                                    <input 
                                                        type="text"
                                                        placeholder="Options (comma separated)..."
                                                        value={q.options || ''}
                                                        onChange={(e) => {
                                                            const newRooms = [...formData.rooms];
                                                            newRooms[index].questions[qIndex].options = e.target.value;
                                                            setFormData({ ...formData, rooms: newRooms });
                                                        }}
                                                        className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-bold outline-none placeholder:text-indigo-300"
                                                    />
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => removeQuestion(room.id, q.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => addQuestion(room.id)}
                                        className="flex items-center gap-2 px-4 py-3 text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-black transition-all w-full justify-center border-2 border-dashed border-indigo-100"
                                    >
                                        <PlusCircle size={16} />
                                        Add Question to {room.name}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Room Button */}
                    <button 
                        onClick={addRoom}
                        className="flex items-center justify-center gap-3 py-6 border-4 border-dashed border-gray-100 rounded-3xl text-gray-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all font-black text-lg tracking-tight"
                    >
                        <Plus size={24} />
                        Add New Room Section
                    </button>
                </div>
            </div>
        </MainLayout>
    );
};

export default CreateInspectionTemplate;
