import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Plus, Search, Filter, Eye, Edit2, Trash2, X, ChevronDown, Loader2, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import api from '../api/client';
import { hasPermission } from '../utils/permissions';

export const Units = () => {
  const [units, setUnits] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUnit, setEditUnit] = useState(null);
  const [viewUnit, setViewUnit] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [unitTypes, setUnitTypes] = useState([]);
  const [showTypesModal, setShowTypesModal] = useState(false);

  // Form state for controlled inputs
  const [formData, setFormData] = useState({
    propertyId: '',
    unitNumber: '',
    unitType: '',
    floor: '',
    rentalMode: 'FULL_UNIT',
    bedrooms: '1',
    status: 'Vacant',
    bedroomIdentifiers: ['Unit-1']
  });

  const [typeFilter, setTypeFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');

  useEffect(() => {
    // Reset page to 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [typeFilter, buildingFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(pagination.page);
    }, 400); // Debounce search/filter
    return () => clearTimeout(timer);
  }, [pagination.page, typeFilter, buildingFilter, search]);

  useEffect(() => {
    if (showModal || viewUnit || editUnit || deleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showModal, viewUnit, editUnit, deleteConfirm]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchUnitTypes = async () => {
    try {
      const res = await api.get('/api/admin/unit-types');
      setUnitTypes(res.data || []);
    } catch (error) {
      console.error('Error fetching unit types:', error);
    }
  };

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: search || '',
        unitType: typeFilter || '',
        propertyId: buildingFilter || ''
      });

      const [unitsRes, buildingsRes] = await Promise.all([
        api.get(`/api/admin/units?${params.toString()}`),
        api.get('/api/admin/properties'),
        fetchUnitTypes() // Fetch unit types too
      ]);

      if (unitsRes.data) {
        setUnits(unitsRes.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: unitsRes.data.pagination?.total || 0,
          totalPages: unitsRes.data.pagination?.totalPages || 0,
          page: unitsRes.data.pagination?.page || 1
        }));
      }
      if (buildingsRes.data) {
        setBuildings(buildingsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      propertyId: '',
      unitNumber: '',
      unitType: '',
      floor: '',
      rentalMode: 'FULL_UNIT',
      bedrooms: '1',
      status: 'Vacant',
      bedroomIdentifiers: ['Unit-1']
    });
  };

  const openAddModal = async () => {
    resetForm();
    setEditUnit(null);
    setShowModal(true);
    // Refresh buildings when opening modal to ensure new buildings appear
    try {
      const res = await api.get('/api/admin/properties');
      setBuildings(res.data);
    } catch (error) {
      console.error('Error refreshing buildings:', error);
    }
  };

  const openEditModal = async (unit) => {
    try {
      // Fetch full details to get bedrooms
      const res = await api.get(`/api/admin/units/${unit.id}`);
      const fullUnit = res.data;

      setFormData({
        propertyId: fullUnit.propertyId?.toString() || '',
        unitNumber: fullUnit.unitNumber || '',
        unitType: fullUnit.unitType || '',
        floor: fullUnit.floor?.toString() || '',
        rentalMode: fullUnit.rentalMode || 'FULL_UNIT',
        bedrooms: fullUnit.bedrooms?.toString() || '1',
        status: fullUnit.status || 'Vacant',
        bedroomIdentifiers: fullUnit.bedroomsList?.map(b => b.bedroomNumber) || []
      });
      setEditUnit(fullUnit);
      setShowModal(true);
    } catch (error) {
      console.error(error);
      showToast('Error loading unit details', 'error');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditUnit(null);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Auto-generate bedroom identifiers logic
      if (name === 'bedrooms' || name === 'unitNumber') {
        const count = parseInt(name === 'bedrooms' ? value : prev.bedrooms) || 0;
        const unitNum = name === 'unitNumber' ? value : prev.unitNumber;

        let currentIds = [...(prev.bedroomIdentifiers || [])];

        // Resize array
        if (currentIds.length < count) {
          // Add new
          for (let i = currentIds.length; i < count; i++) {
            currentIds.push(`${unitNum || 'Unit'}-${i + 1}`);
          }
        } else if (currentIds.length > count) {
          // Trim
          currentIds = currentIds.slice(0, count);
        }

        // Auto-refresh identifiers logic: Sync if empty, default, or matching the previous unit pattern
        currentIds = currentIds.map((id, i) => {
          const defaultPattern = `Unit-${i + 1}`;
          const prevPattern = `${prev.unitNumber || 'Unit'}-${i + 1}`;

          if (!id || id === defaultPattern || id === prevPattern) {
            return `${unitNum || 'Unit'}-${i + 1}`;
          }
          return id;
        });

        newData.bedroomIdentifiers = currentIds;
      }
      return newData;
    });
  };

  const handleBedroomChange = (index, value) => {
    const newIds = [...formData.bedroomIdentifiers];
    newIds[index] = value;
    setFormData(prev => ({ ...prev, bedroomIdentifiers: newIds }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const selectedProperty = buildings.find(b => b.id === parseInt(formData.propertyId));

      const payload = {
        unitNumber: formData.unitNumber,
        unit: formData.unitNumber, // Map to backend expected field
        unitType: formData.unitType || null,
        floor: formData.floor ? parseInt(formData.floor) : null,
        bedrooms: parseInt(formData.bedrooms) || 1,
        propertyId: formData.propertyId,
        building: selectedProperty ? selectedProperty.name : 'Unknown',
        rentalMode: formData.rentalMode,
        status: formData.status,
        bedroomIdentifiers: formData.bedroomIdentifiers
      };

      if (editUnit) {
        // Update existing unit
        await api.put(`/api/admin/units/${editUnit.id}`, payload);
        showToast('Unit updated successfully');
      } else {
        // Create new unit
        await api.post('/api/admin/units', payload);
        showToast('Unit created successfully');
      }

      // Refresh data so new unit appears properly with all calculated fields
      await fetchData(pagination.page);

      closeModal();
    } catch (error) {
      console.error('Error saving unit:', error);
      showToast(error.response?.data?.message || 'Error saving unit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (unit) => {
    setSubmitting(true);
    try {
      await api.delete(`/api/admin/units/${unit.id}`);
      setDeleteConfirm(null);
      showToast('Unit deleted successfully');
      await fetchData(pagination.page);
    } catch (error) {
      console.error('Error deleting unit:', error);
      showToast(error.response?.data?.message || 'Error deleting unit', 'error');
    } finally {
      setSubmitting(false);
    }
  };
  const filteredUnits = units; // Server now returns already filtered units

  const getPageNumbers = () => {
    const total = Math.max(1, pagination.totalPages || 1);
    const current = pagination.page;
    const delta = 1; // Range around current page
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    let l;
    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <MainLayout title="Units">
      <div className="flex flex-col gap-6">

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[10000] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* TOP CONTROLS */}
        <section className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-white py-2.5 px-3.5 rounded-xl shadow-sm border border-slate-200">
              <Filter size={16} className="text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border-none outline-none text-sm bg-transparent text-slate-700 min-w-[120px] font-medium cursor-pointer"
              >
                <option value="">All Types</option>
                {unitTypes.map(t => (
                  <option key={t.typeName} value={t.typeName}>{t.typeName}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white py-2.5 px-3.5 rounded-xl shadow-sm border border-slate-200">
              <Filter size={16} className="text-slate-400" />
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="border-none outline-none text-sm bg-transparent text-slate-700 min-w-[120px] font-medium cursor-pointer"
              >
                <option value="">All Buildings</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white py-2.5 px-3.5 rounded-xl shadow-sm border border-slate-200">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search by unit or building"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none outline-none text-sm w-48 text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {hasPermission('Units', 'edit') && (
              <Button variant="secondary" onClick={() => setShowTypesModal(true)}>
                <Settings size={18} />
                Manage Types
              </Button>
            )}
            {hasPermission('Units', 'add') && (
              <Button variant="primary" onClick={openAddModal}>
                <Plus size={18} />
                Add Unit
              </Button>
            )}
          </div>
        </section>

        {/* TABLE */}
        <section className="bg-white rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.08)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
              <span className="ml-3 text-slate-500">Loading units...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 min-w-[800px] p-3.5 px-5 font-semibold bg-slate-50 text-slate-500 text-sm border-b border-slate-100 uppercase tracking-wide">
                  <span>Unit Identifier</span>
                  <span>Building Name</span>
                  <span>Unit Type</span>
                  <span>Floor</span>
                  <span>Bedrooms</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {filteredUnits.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No units found. Click "Add Unit" to create one.
                  </div>
                ) : (
                  filteredUnits.map((unit) => (
                    <div key={unit.id} className="grid grid-cols-7 min-w-[800px] p-3.5 px-5 transition-all duration-300 hover:bg-slate-50 bg-white border-b border-slate-50 last:border-0 text-sm items-center">
                      <Link to={`/units/${unit.id}`} className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-all">
                        {unit.unitNumber}
                      </Link>
                      <span className="font-bold text-indigo-600">{unit.buildingName || unit.civicNumber}</span>
                      <span className="text-slate-600">{unit.unitType || '-'}</span>
                      <span className="text-slate-600">{unit.floor || '-'}</span>
                      <span className="text-slate-600">{unit.bedrooms || '-'}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${unit.status === 'Occupied' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        unit.status === 'Fully Booked' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                        {unit.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link to={`/units/${unit.id}`}>
                          <Eye
                            size={16}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                          />
                        </Link>
                        {hasPermission('Units', 'edit') && (
                          <Edit2
                            size={16}
                            className="cursor-pointer text-slate-400 hover:text-blue-600 transition-colors"
                            onClick={() => openEditModal(unit)}
                          />
                        )}
                        {hasPermission('Units', 'delete') && (
                          <Trash2
                            size={16}
                            className="cursor-pointer text-slate-400 hover:text-red-600 transition-colors"
                            onClick={() => setDeleteConfirm(unit)}
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* PAGINATION */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border-t border-slate-100 gap-4">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Showing {filteredUnits.length} of {pagination.total} units
                </span>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="!px-2"
                  >
                    Prev
                  </Button>

                  {getPageNumbers().map((pageNum, idx) => (
                    pageNum === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 text-slate-400 text-sm">...</span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${pagination.page === pageNum
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200'
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page >= (pagination.totalPages || 1)}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="!px-2"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ADD/EDIT UNIT MODAL - FULL SCREEN */}
        {
          showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white">
                    {editUnit ? 'Edit Unit' : 'Add New Unit'}
                  </h3>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="overflow-y-auto flex-1 p-6">
                  <form id="unitForm" onSubmit={handleSubmit} className="space-y-5">
                    {/* Building Name Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Building Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="propertyId"
                          value={formData.propertyId}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3.5 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-white text-sm appearance-none pr-10 transition-all"
                        >
                          <option value="" disabled>Select Building</option>
                          {buildings
                            .filter(b => b.status === 'Active')
                            .map(b => (
                              <option key={b.id} value={b.id}>
                                {b.name} - {b.civicNumber}
                              </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <ChevronDown size={18} className="text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* Unit Identifier */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Unit Identifier <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="unitNumber"
                        value={formData.unitNumber}
                        onChange={handleInputChange}
                        placeholder="e.g., 82-101"
                        required
                        className="w-full p-3.5 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm transition-all"
                      />
                    </div>

                    {/* Unit Type & Floor Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Unit Type
                        </label>
                        <div className="relative">
                          <select
                            name="unitType"
                            value={formData.unitType}
                            onChange={handleInputChange}
                            className="w-full p-3.5 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-white text-sm appearance-none pr-10 transition-all font-medium"
                          >
                            <option value="">Select Type</option>
                            {unitTypes.map((type) => (
                              <option key={type.typeName} value={type.typeName}>
                                {type.typeName}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown size={18} className="text-slate-400" />
                          </div>
                        </div>

                        {/* Rate visualizer below select */}
                        {formData.unitType && (() => {
                          const matchedType = unitTypes.find(t => t.typeName === formData.unitType);
                          if (!matchedType) return null;
                          return (
                            <p className="text-[11px] font-black text-indigo-500 mt-1.5 pl-1 animate-in slide-in-from-left-1">
                               💡 Standard Rates: Full ${parseFloat(matchedType.fullUnitRate).toLocaleString()} | Single Bed ${parseFloat(matchedType.singleBedroomRate).toLocaleString()}
                            </p>
                          );
                        })()}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Floor
                        </label>
                        <input
                          name="floor"
                          type="number"
                          value={formData.floor}
                          onChange={handleInputChange}
                          placeholder="e.g., 1"
                          min="1"
                          className="w-full p-3.5 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm transition-all"
                        />
                      </div>
                    </div>

                    {/* Bedrooms */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Number of Bedrooms
                      </label>
                      <input
                        name="bedrooms"
                        type="number"
                        value={formData.bedrooms}
                        onChange={handleInputChange}
                        placeholder="e.g., 3"
                        min="0"
                        className="w-full p-3.5 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm transition-all"
                      />

                      {/* Dynamic Bedroom Inputs */}
                      {parseInt(formData.bedrooms) > 0 && (
                        <div className="mt-4 space-y-3 pl-4 border-l-2 border-slate-100">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bedroom Identifiers</h4>
                          {Array.from({ length: parseInt(formData.bedrooms) }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-1">
                              <label className="text-xs text-slate-500">Bedroom {i + 1}</label>
                              <input
                                value={formData.bedroomIdentifiers[i] || ''}
                                onChange={(e) => handleBedroomChange(i, e.target.value)}
                                placeholder={`e.g., ${formData.unitNumber || '82-101'}-${i + 1}`}
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Status (only for edit) */}
                    {editUnit && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Status
                        </label>
                        <div className="relative">
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full p-3.5 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-white text-sm appearance-none pr-10 transition-all"
                          >
                            <option value="Vacant">Vacant</option>
                            <option value="Occupied">Occupied</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown size={18} className="text-slate-400" />
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-slate-50 rounded-b-2xl">
                  <Button type="button" variant="secondary" onClick={closeModal} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" form="unitForm" variant="primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {editUnit ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      editUnit ? 'Update Unit' : 'Save Unit'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )
        }

        {/* VIEW UNIT MODAL */}
        {
          viewUnit && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
                  <h3 className="text-lg font-bold text-slate-900">Unit Details</h3>
                  <button
                    onClick={() => setViewUnit(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Unit Identifier</p>
                      <p className="text-sm font-medium text-slate-900">{viewUnit.unitNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Unit Type</p>
                      <p className="text-sm font-medium text-slate-900">{viewUnit.unitType || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Building Name</p>
                      <p className="text-sm font-bold text-indigo-600">{viewUnit.building || viewUnit.civicNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Floor</p>
                      <p className="text-sm font-medium text-slate-900">{viewUnit.floor || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Bedrooms</p>
                      <p className="text-sm font-medium text-slate-900">{viewUnit.bedrooms || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Status</p>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${viewUnit.status === 'Occupied' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {viewUnit.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-slate-50 rounded-b-2xl">
                  <Button variant="secondary" onClick={() => setViewUnit(null)}>
                    Close
                  </Button>
                  <Button variant="primary" onClick={() => { setViewUnit(null); openEditModal(viewUnit); }}>
                    <Edit2 size={16} />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          )
        }

        {/* DELETE CONFIRMATION MODAL */}
        {
          deleteConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={24} className="text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Unit</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    Are you sure you want to delete unit <strong>{deleteConfirm.unitNumber}</strong>? This action cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)} disabled={submitting}>
                      Cancel
                    </Button>
                    <button
                      onClick={() => handleDelete(deleteConfirm)}
                      disabled={submitting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }


        {showTypesModal && (
          <ManageTypesModal
            types={unitTypes}
            onClose={() => setShowTypesModal(false)}
            onRefresh={fetchUnitTypes}
          />
        )}
      </div >
    </MainLayout >
  );
};

/* MANAGE TYPES MODAL COMPONENT */
const ManageTypesModal = ({ types, onClose, onRefresh }) => {
  const [newType, setNewType] = useState({ typeName: '', fullUnitRate: '', singleBedroomRate: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newType.typeName.trim()) return;

    setLoading(true);
    try {
      const payload = {
        typeName: newType.typeName.trim(),
        fullUnitRate: parseFloat(newType.fullUnitRate) || 0,
        singleBedroomRate: parseFloat(newType.singleBedroomRate) || 0
      };

      if (editingId) {
        await api.put(`/api/admin/unit-types/${editingId}`, payload);
      } else {
        await api.post('/api/admin/unit-types', payload);
      }

      await onRefresh();
      setNewType({ typeName: '', fullUnitRate: '', singleBedroomRate: '' });
      setEditingId(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving type');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this unit type?')) return;

    setLoading(true);
    try {
      await api.delete(`/api/admin/unit-types/${id}`);
      await onRefresh();
      if (editingId === id) {
        setNewType({ typeName: '', fullUnitRate: '', singleBedroomRate: '' });
        setEditingId(null);
      }
    } catch (error) {
      alert('Error deleting type');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type) => {
    setNewType({
      typeName: type.typeName,
      fullUnitRate: type.fullUnitRate || '',
      singleBedroomRate: type.singleBedroomRate || ''
    });
    setEditingId(type.id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">Manage Unit Type Rates</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {editingId ? '✏️ Edit Preset' : '➕ Add New Preset'}
              </span>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => { setEditingId(null); setNewType({ typeName: '', fullUnitRate: '', singleBedroomRate: '' }); }}
                  className="text-xs text-rose-500 hover:underline"
                >Cancel</button>
              )}
            </div>
            <input
              value={newType.typeName}
              onChange={(e) => setNewType({ ...newType, typeName: e.target.value })}
              placeholder="Type Name (e.g. Makenzie)"
              className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm font-bold"
              autoFocus
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Full Unit $</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newType.fullUnitRate}
                  onChange={(e) => setNewType({ ...newType, fullUnitRate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Single Bed $</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newType.singleBedroomRate}
                  onChange={(e) => setNewType({ ...newType, singleBedroomRate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <Button variant="primary" disabled={loading || !newType.typeName.trim()} className="mt-1 shadow-sm">
              {editingId ? 'Update Preset Rule' : 'Add Preset Rates'}
            </Button>
          </form>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {types.length === 0 ? (
              <p className="text-center text-slate-400 py-4 text-xs">No unit types found.</p>
            ) : (
              types.map((type) => (
                <div key={type.id} className={`flex justify-between items-center bg-white p-3 rounded-xl border ${editingId === type.id ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-100'} hover:shadow-md hover:border-indigo-100 transition-all`}>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{type.typeName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Full: <span className="font-bold text-slate-700">${parseFloat(type.fullUnitRate || 0).toLocaleString()}</span> | 
                      Bed: <span className="font-bold text-slate-700">${parseFloat(type.singleBedroomRate || 0).toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(type)}
                      disabled={loading}
                      className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Edit Type"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(type.id)}
                      disabled={loading}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete Type"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
