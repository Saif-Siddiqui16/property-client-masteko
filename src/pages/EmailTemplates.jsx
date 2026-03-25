import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Mail, Edit2, Trash2, Plus, X, Search, FileText, Paperclip, Check } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';

const EmailTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState({ name: '', subject: '', body: '', documentIds: [] });
    const [availableDocs, setAvailableDocs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTemplates();
        fetchDocuments();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/email/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/api/admin/documents?limit=1000');
            const docs = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setAvailableDocs(docs);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentTemplate.id) {
                await api.put(`/api/admin/email/templates/${currentTemplate.id}`, currentTemplate);
            } else {
                await api.post('/api/admin/email/templates', currentTemplate);
            }
            setIsModalOpen(false);
            fetchTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await api.delete(`/api/admin/email/templates/${id}`);
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    const openModal = (template = { name: '', subject: '', body: '', documentIds: [] }) => {
        setCurrentTemplate({
            ...template,
            documentIds: template.documents?.map(d => d.id) || []
        });
        setIsModalOpen(true);
    };

    const toggleDocument = (docId) => {
        const ids = [...currentTemplate.documentIds];
        const index = ids.indexOf(docId);
        if (index > -1) ids.splice(index, 1);
        else ids.push(docId);
        setCurrentTemplate({ ...currentTemplate, documentIds: ids });
    };

    const filteredTemplates = templates.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MainLayout title="Email Templates">
            <div className="space-y-6 text-slate-800">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Mail className="h-6 w-6 text-indigo-600" />
                        Email Templates
                    </h1>
                    <p className="text-gray-500 mt-1">Manage reusable professional communication templates.</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-indigo-100 active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    New Template
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-white font-medium"
                />
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white border border-gray-100 h-64 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="bg-white p-20 text-center rounded-2xl border border-dashed border-gray-200">
                    <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600">No templates found</h3>
                    <p className="text-gray-400 mt-2">Create your first template to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map(template => (
                        <div key={template.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all group overflow-hidden flex flex-col">
                            <div className="p-6 flex-grow">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="bg-indigo-50 p-2.5 rounded-xl">
                                        <FileText className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(template)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(template.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{template.name}</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Subject: {template.subject}</p>
                                <div className="mt-4 text-xs text-gray-400 line-clamp-3">
                                    {template.body.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-500 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                    <Paperclip className="h-3.5 w-3.5" />
                                    {template.documents?.length || 0} Attachments
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium italic">
                                    Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal - Simplified Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h2 className="text-2xl font-bold text-gray-900">{currentTemplate.id ? 'Edit Template' : 'New Template'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="overflow-y-auto p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Template Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentTemplate.name}
                                        onChange={(e) => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                                        className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50/50"
                                        placeholder="e.g. Rent Reminder"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject Line</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentTemplate.subject}
                                        onChange={(e) => setCurrentTemplate({...currentTemplate, subject: e.target.value})}
                                        className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50/50"
                                        placeholder="Dynamic fields like {{tenantFirstName}} supported"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 text-center bg-gray-100 py-1 rounded-t-xl border-x-2 border-t-2 border-gray-100">
                                    Email Body (HTML)
                                </label>
                                <textarea 
                                    rows="10"
                                    required
                                    value={currentTemplate.body}
                                    onChange={(e) => setCurrentTemplate({...currentTemplate, body: e.target.value})}
                                    className="w-full px-5 py-4 border-2 border-gray-100 rounded-b-2xl focus:border-indigo-500 focus:ring-0 transition-all outline-none font-mono text-sm bg-gray-50/50"
                                    placeholder="Write your email body here... (Rich text editor integration coming in Composer)"
                                />
                                <p className="mt-2 text-xs text-gray-400 italic">Available placeholders: {"{{tenantFirstName}}, {{tenantLastName}}, {{buildingName}}, {{unitNumber}}, {{rentAmount}}, {{outstandingBalance}} ..."}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Linked Attachments (Shared Files)</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {availableDocs.map(doc => (
                                        <button
                                            key={doc.id}
                                            type="button"
                                            onClick={() => toggleDocument(doc.id)}
                                            className={`flex justify-between items-center p-3 rounded-xl border-2 transition-all ${
                                                currentTemplate.documentIds.includes(doc.id) 
                                                ? 'border-indigo-500 bg-indigo-50/50' 
                                                : 'border-gray-50 bg-gray-50 hover:border-gray-200'
                                            }`}
                                        >
                                            <span className="text-xs font-semibold truncate max-w-[120px]">{doc.name}</span>
                                            {currentTemplate.documentIds.includes(doc.id) && <Check className="h-4 w-4 text-indigo-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-indigo-100"
                                >
                                    {currentTemplate.id ? 'Update Template' : 'Create Template'}
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

export default EmailTemplates;
