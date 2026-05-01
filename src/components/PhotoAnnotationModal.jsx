import React, { useRef, useState } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { X, Undo, Redo, Trash2, Save, Download } from 'lucide-react';

const PhotoAnnotationModal = ({ isOpen, onClose, photoUrl, onSave }) => {
    const canvasRef = useRef(null);
    const [strokeColor, setStrokeColor] = useState('#ff0000');
    const [strokeWidth, setStrokeWidth] = useState(4);

    if (!isOpen) return null;

    const handleSave = async () => {
        const data = await canvasRef.current.exportImage('png');
        onSave(data);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm">
            <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Annotate Deficiency</h2>
                        <p className="text-gray-500 text-sm font-medium">Draw on the photo to highlight specific issues.</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-100">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 relative bg-gray-100 overflow-hidden flex items-center justify-center">
                    <div className="relative w-full h-full flex items-center justify-center p-8">
                        <div className="relative shadow-2xl rounded-3xl overflow-hidden border-8 border-white bg-white w-full h-full">
                            <ReactSketchCanvas
                                ref={canvasRef}
                                strokeColor={strokeColor}
                                strokeWidth={strokeWidth}
                                canvasColor="transparent"
                                backgroundImage={photoUrl}
                                preserveBackgroundImageAspectRatio="contain"
                                style={{ border: 'none', width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-white border-t border-gray-100 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Color</span>
                            <div className="flex gap-2">
                                {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ffffff'].map(color => (
                                    <button 
                                        key={color}
                                        onClick={() => setStrokeColor(color)}
                                        className={`w-8 h-8 rounded-full border-4 transition-all ${strokeColor === color ? 'border-gray-200 scale-110 shadow-lg' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="h-10 w-px bg-gray-100" />
                        <div className="flex items-center gap-3">
                            <button onClick={() => canvasRef.current.undo()} className="p-3 hover:bg-gray-50 rounded-xl transition-all text-gray-600" title="Undo">
                                <Undo size={20} />
                            </button>
                            <button onClick={() => canvasRef.current.redo()} className="p-3 hover:bg-gray-50 rounded-xl transition-all text-gray-600" title="Redo">
                                <Redo size={20} />
                            </button>
                            <button onClick={() => canvasRef.current.clearCanvas()} className="p-3 hover:bg-red-50 rounded-xl transition-all text-red-400 hover:text-red-600" title="Clear">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-4 bg-gray-50 text-gray-600 rounded-2xl text-sm font-black hover:bg-gray-100 transition-all uppercase tracking-widest">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest">
                            <Save size={18} /> Apply Annotation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoAnnotationModal;
