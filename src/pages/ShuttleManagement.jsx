import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/Card';
import api from '../api/client';
import { format } from 'date-fns';

export const ShuttleManagement = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('requests'); // Access, Schedule, Requests, Drivers, History
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Data States
  const [requests, setRequests] = useState([]);
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected
  const [accessSearch, setAccessSearch] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', phone: '', email: '' });
  
  // UI States
  const [showTripModal, setShowTripModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newTrip, setNewTrip] = useState({ 
    time: '', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    origin: '', 
    destination: '', 
    seats_total: 7 
  });

  const [newRequest, setNewRequest] = useState({
    tenant_name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    origin: '',
    destination: '',
    passengers: 1,
    notes: ''
  });

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds to stay in sync with mobile app actions
    const pollInterval = setInterval(() => {
      fetchData(true); // pass true to skip the loading spinner for background refresh
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [activeTab, targetDate]);

  const fetchData = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    try {
      if (activeTab === 'requests') {
        const res = await api.get('/api/admin/shuttle/requests');
        setRequests(res.data.requests || []);
      } else if (activeTab === 'schedule') {
        const res = await api.get('/api/admin/shuttle/trips', { params: { date: targetDate } });
        setTrips(res.data.trips || []);
      } else if (activeTab === 'access' || activeTab === 'drivers') {
        const res = await api.get('/api/admin/shuttle/users');
        setUsers(res.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching shuttle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (id) => {
    // 6.3 Conflict Handling: Check if there's already a trip at the same time
    const request = requests.find(r => r.id === id);
    if (request) {
      const conflict = trips.find(t => t.time === request.time && t.date === request.date);
      if (conflict) {
        if (!window.confirm(`WARNING: There is already a trip scheduled at ${request.time} on ${request.date}. Do you still want to approve this request?`)) {
          return;
        }
      }
    }

    try {
      await api.put(`/api/admin/shuttle/requests/${id}/status`, { status: 'approved' });
      fetchData(); // Refresh list
    } catch (error) {
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await api.put(`/api/admin/shuttle/requests/${id}/status`, { status: 'rejected' });
      fetchData();
    } catch (error) {
      alert('Failed to reject request');
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      await api.delete(`/api/admin/shuttle/trips/${id}`);
      fetchData();
    } catch (error) {
      alert('Failed to delete trip');
    }
  };

  const handleDuplicateDay = async (sourceDate) => {
    try {
      await api.post('/api/admin/shuttle/trips/duplicate', { 
        sourceDate, 
        targetDate 
      });
      setShowDuplicateModal(false);
      fetchData();
    } catch (error) {
      alert('Failed to duplicate day');
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedTrip) {
        await api.put(`/api/admin/shuttle/trips/${selectedTrip.id}`, newTrip);
      } else {
        await api.post('/api/admin/shuttle/trips', newTrip);
      }
      setShowTripModal(false);
      setIsEditing(false);
      setNewTrip({ 
        time: '', 
        date: format(new Date(), 'yyyy-MM-dd'), 
        origin: '', 
        destination: '', 
        seats_total: 7 
      });
      fetchData();
    } catch (error) {
      alert(isEditing ? 'Failed to update trip' : 'Failed to create trip');
    }
  };

  const handleOpenEditModal = (trip) => {
    setSelectedTrip(trip);
    setNewTrip({
      ...trip,
      actual_passengers: trip.actual_passengers || 0,
      notes: trip.notes || '',
      status: trip.status || 'scheduled'
    });
    setIsEditing(true);
    setShowTripModal(true);
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setNewTrip({ 
      time: '', 
      date: targetDate || format(new Date(), 'yyyy-MM-dd'), 
      origin: '', 
      destination: '', 
      seats_total: 7 
    });
    setShowTripModal(true);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/shuttle/requests', newRequest);
      setShowRequestModal(false);
      setNewRequest({
        tenant_name: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '',
        origin: '',
        destination: '',
        passengers: 1,
        notes: ''
      });
      fetchData();
    } catch (error) {
      alert('Failed to create request');
    }
  };

  const openPassengerModal = (trip) => {
    setSelectedTrip(trip);
    setShowPassengerModal(true);
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.tenant_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.origin?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.destination?.toLowerCase().includes(searchFilter.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  return (
    <MainLayout title={t('shuttle.title')}>
      <div className="flex flex-col gap-6 relative">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
          {['requests', 'schedule', 'access', 'drivers', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t(`shuttle.${tab}`)}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <Card className="p-0 overflow-hidden bg-white shadow-sm rounded-xl">
            {activeTab === 'requests' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">{t('shuttle.requests')}</h3>
                  <div className="flex gap-3">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search Tenant or Route..." 
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button 
                      onClick={() => setShowRequestModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all whitespace-nowrap"
                    >
                      Add Request
                    </button>
                  </div>
                </div>
                {filteredRequests.length === 0 ? (
                  <p className="text-gray-500 py-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No requests found matching your filters.
                  </p>
                ) : (
                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Tenant</th>
                        <th className="px-4 py-3">Date & Time</th>
                        <th className="px-4 py-3">Route</th>
                        <th className="px-4 py-3">Passengers</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRequests.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800">{req.tenant_name}</td>
                          <td className="px-4 py-3 text-slate-600">{req.date} at {req.time}</td>
                          <td className="px-4 py-3 text-slate-600">{req.origin} &rarr; {req.destination}</td>
                          <td className="px-4 py-3 text-slate-600 font-semibold">{req.passengers}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${
                              req.status === 'approved' ? 'bg-green-100 text-green-700' :
                              req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {req.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => handleApproveRequest(req.id)} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 shadow-sm">Approve</button>
                                <button onClick={() => handleRejectRequest(req.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-md text-xs font-bold hover:bg-red-100 border border-red-100">Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                    <span className="text-xs font-medium text-slate-500">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
                    </span>
                    <div className="flex gap-2">
                       <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-2 border border-slate-100 rounded-lg bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                       </button>
                       <span className="flex items-center px-4 text-xs font-bold text-slate-700 bg-slate-50 rounded-lg border border-slate-100">
                         {currentPage} / {totalPages}
                       </span>
                       <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-2 border border-slate-100 rounded-lg bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-slate-800">{t('shuttle.schedule')}</h3>
                    <input 
                      type="date" 
                      className="p-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={targetDate} 
                      onChange={(e) => setTargetDate(e.target.value)} 
                    />
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => setShowDuplicateModal(true)}
                      className="flex-1 md:flex-none px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
                    >
                      Duplicate Schedule
                    </button>
                    <button 
                      onClick={handleOpenAddModal}
                      className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-100"
                    >
                      {t('shuttle.add_base_trip')}
                    </button>
                  </div>
                </div>

                {trips.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">{t('shuttle.no_trips')} for this date.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {trips.map(trip => (
                      <div key={trip.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-xl hover:border-indigo-100 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-lg font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">{trip.time}</span>
                          <div className="flex gap-1">
                            {trip.is_special && <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-1 rounded-md">Special</span>}
                            <button 
                              onClick={() => handleOpenEditModal(trip)}
                              className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit Trip"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete Trip"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                           {trip.origin} 
                           <span className="text-slate-400 font-normal">→</span> 
                           {trip.destination}
                        </p>
                        <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center text-sm">
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {trip.seats_total - (trip.seats_remaining || 0)} / {trip.seats_total}
                          </div>
                          <button 
                            onClick={() => openPassengerModal(trip)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                          >
                            View Passengers
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'access' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{t('shuttle.access')}</h3>
                    <p className="text-xs text-gray-500">Manage mobile app permissions for tenants.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search Name or Email..." 
                        value={accessSearch}
                        onChange={(e) => setAccessSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button className="px-3 py-2 text-indigo-600 bg-indigo-50 rounded-lg text-xs font-bold hover:bg-indigo-100">Bulk Enable</button>
                    <button className="px-3 py-2 text-red-600 bg-red-50 rounded-lg text-xs font-bold hover:bg-red-100">Bulk Disable</button>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                   <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-gray-100">
                        <tr>
                          <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Tenant Name</th>
                          <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Email Address</th>
                          <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Status</th>
                          <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-right">App Access</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {users.filter(u => u.role === 'tenant' && (u.name.toLowerCase().includes(accessSearch.toLowerCase()) || u.email.toLowerCase().includes(accessSearch.toLowerCase()))).map(user => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 font-semibold text-slate-700">{user.name}</td>
                            <td className="px-5 py-4 text-slate-500">{user.email}</td>
                            <td className="px-5 py-4">
                              <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">Active</span>
                            </td>
                            <td className="px-5 py-4 text-right">
                               <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
            )}
            
            {activeTab === 'drivers' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{t('shuttle.drivers')}</h3>
                    <p className="text-xs text-gray-500">Contact information and status for system drivers.</p>
                  </div>
                  <button 
                    onClick={() => { setIsEditing(false); setShowDriverModal(true); }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-100"
                  >
                    Add Driver
                  </button>
                </div>
                 <table className="min-w-full text-left text-sm border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-600">Driver Name</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Phone Number</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.filter(u => u.role === 'driver').map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 font-semibold text-slate-700">{user.name}</td>
                          <td className="px-5 py-4 text-slate-500 font-medium">{user.phone || '—'}</td>
                          <td className="px-5 py-4">
                            <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">Active</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => { setIsEditing(true); setSelectedTrip(user); setShowDriverModal(true); }} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold mr-4">Edit</button>
                            <button className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.role === 'driver').length === 0 && (
                        <tr><td colSpan="4" className="text-center py-12 text-slate-400 font-medium">No drivers added yet.</td></tr>
                      )}
                    </tbody>
                 </table>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{t('shuttle.history')}</h3>
                    <p className="text-xs text-gray-500">Log of past trips and requests activity.</p>
                  </div>
                  <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">Export CSV</button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">Recently Completed Trips</h4>
                    <div className="grid gap-3">
                      {trips.filter(t => new Date(t.date) < new Date()).length === 0 ? (
                        <div className="py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-sm font-medium">
                          No past trips found in the records.
                        </div>
                      ) : (
                        trips.filter(t => new Date(t.date) < new Date()).slice(0, 5).map(trip => (
                          <div key={trip.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{trip.time}</span>
                              <div>
                                <p className="text-sm font-bold text-slate-700">{trip.origin} &rarr; {trip.destination}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Date: {trip.date}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">Completed</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">Past Requests Status</h4>
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                       <table className="min-w-full text-left text-sm">
                          <tbody className="divide-y divide-slate-50">
                            {requests.filter(r => r.status !== 'pending').slice(0, 5).map(req => (
                              <tr key={req.id}>
                                <td className="px-5 py-3 font-semibold text-slate-700">{req.tenant_name}</td>
                                <td className="px-5 py-3 text-slate-400 text-xs">{req.date} at {req.time}</td>
                                <td className="px-5 py-3 text-right">
                                  <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {req.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                       </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </Card>
        )}

        {/* --- MODALS --- */}

        {/* Add Trip Modal */}
        {showTripModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg">{isEditing ? 'Edit Trip' : 'Add New Trip'}</h3>
                <button onClick={() => setShowTripModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">×</button>
              </div>
              <form onSubmit={handleCreateTrip} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                    <input disabled={isEditing} required type="date" className={`w-full p-2.5 border border-gray-200 rounded-lg outline-none ${isEditing ? 'bg-slate-100 text-slate-400' : 'bg-white focus:ring-2 focus:ring-indigo-500'}`} value={newTrip.date} onChange={e => setNewTrip({...newTrip, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time</label>
                    <input disabled={isEditing} required type="time" className={`w-full p-2.5 border border-gray-200 rounded-lg outline-none ${isEditing ? 'bg-slate-100 text-slate-400' : 'bg-white focus:ring-2 focus:ring-indigo-500'}`} value={newTrip.time} onChange={e => setNewTrip({...newTrip, time: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From</label>
                    <input disabled={isEditing} required className={`w-full p-2.5 border border-gray-200 rounded-lg outline-none ${isEditing ? 'bg-slate-100 text-slate-400' : 'bg-white focus:ring-2 focus:ring-indigo-500'}`} value={newTrip.origin} onChange={e => setNewTrip({...newTrip, origin: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To</label>
                    <input disabled={isEditing} required className={`w-full p-2.5 border border-gray-200 rounded-lg outline-none ${isEditing ? 'bg-slate-100 text-slate-400' : 'bg-white focus:ring-2 focus:ring-indigo-500'}`} value={newTrip.destination} onChange={e => setNewTrip({...newTrip, destination: e.target.value})} />
                  </div>
                </div>
                
                {isEditing ? (
                  <div className="space-y-4 pt-2">
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <p className="text-[10px] text-amber-700 font-bold uppercase mb-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Backend Limitation
                      </p>
                      <p className="text-[10px] text-amber-600 font-medium">Route and capacity cannot be edited yet. Only Status and Notes will be saved.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                        <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newTrip.status} onChange={e => setNewTrip({...newTrip, status: e.target.value})}>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Actual Pass.</label>
                        <input type="number" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newTrip.actual_passengers} onChange={e => setNewTrip({...newTrip, actual_passengers: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                      <textarea className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" rows="2" value={newTrip.notes} onChange={e => setNewTrip({...newTrip, notes: e.target.value})} placeholder="Driver notes or delays..." />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Capacity</label>
                    <input type="number" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newTrip.seats_total} onChange={e => setNewTrip({...newTrip, seats_total: e.target.value})} />
                  </div>
                )}
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]">
                  {isEditing ? 'Save Changes' : 'Create Trip'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Passenger Modal */}
        {showPassengerModal && selectedTrip && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <div className="flex flex-col">
                   <h3 className="font-bold text-slate-800 text-lg">Passenger List</h3>
                   <span className="text-xs text-slate-500 font-medium">{selectedTrip.time}: {selectedTrip.origin} &rarr; {selectedTrip.destination}</span>
                </div>
                <button onClick={() => setShowPassengerModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-2xl">×</button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-auto">
                {(!selectedTrip.bookings || selectedTrip.bookings.length === 0) ? (
                  <div className="py-10 text-center text-gray-400 flex flex-col items-center">
                    <span className="text-4xl mb-2">🚌</span>
                    <p>No passengers have joined this trip yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="border-b border-gray-100 italic text-gray-400 text-xs">
                       <tr>
                         <th className="pb-2">Name</th>
                         <th className="pb-2">Guests</th>
                         <th className="pb-2">Booking ID</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedTrip.bookings.map(book => (
                        <tr key={book.id}>
                          <td className="py-3 font-semibold text-slate-700">{book.user?.name || 'Unknown User'}</td>
                          <td className="py-3 text-slate-600">{book.seats}</td>
                          <td className="py-3 text-[10px] text-slate-400 uppercase tracking-tighter">#{book.id.slice(-8)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="p-4 bg-gray-50 text-right">
                 <button onClick={() => setShowPassengerModal(false)} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Ride Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg">New Ride Request</h3>
                <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">×</button>
              </div>
              <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tenant Name</label>
                  <input required className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newRequest.tenant_name} onChange={e => setNewRequest({...newRequest, tenant_name: e.target.value})} placeholder="Full name of the tenant" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                    <input required type="date" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newRequest.date} onChange={e => setNewRequest({...newRequest, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time</label>
                    <input required type="time" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newRequest.time} onChange={e => setNewRequest({...newRequest, time: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From</label>
                    <input required className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newRequest.origin} onChange={e => setNewRequest({...newRequest, origin: e.target.value})} placeholder="e.g. Campus" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To</label>
                    <input required className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newRequest.destination} onChange={e => setNewRequest({...newRequest, destination: e.target.value})} placeholder="e.g. Station" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Passengers</label>
                  <input type="number" min="1" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newRequest.passengers} onChange={e => setNewRequest({...newRequest, passengers: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes (Optional)</label>
                  <textarea className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" rows="2" value={newRequest.notes} onChange={e => setNewRequest({...newRequest, notes: e.target.value})} placeholder="Any special instructions..." />
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]">Create Request</button>
              </form>
            </div>
          </div>
        )}

        {/* Duplicate Modal */}
        {showDuplicateModal && (
          <DuplicateModal 
            onClose={() => setShowDuplicateModal(false)}
            onDuplicate={handleDuplicateDay}
            targetDate={targetDate}
          />
        )}
      </div>
    </MainLayout>
  );
};

const DuplicateModal = ({ onClose, onDuplicate, targetDate }) => {
  const [sourceDate, setSourceDate] = useState(format(new Date(new Date().setDate(new Date().getDate() - 1)), 'yyyy-MM-dd'));
  
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Duplicate Schedule</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">Choose a source date to copy trips FROM. They will be added to <b>{targetDate}</b>.</p>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Source Date</label>
            <input 
              type="date" 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={sourceDate} 
              onChange={e => setSourceDate(e.target.value)} 
            />
          </div>
          <div className="flex gap-3 pt-4">
             <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Cancel</button>
             <button 
              onClick={() => onDuplicate(sourceDate)}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200"
             >
               Copy Trips
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
