import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { OwnerLayout } from '../layouts/owner/OwnerLayout';
import { Button } from '../components/Button';
import { Search, Filter, Building2, Download, Building, Users, Wallet, KeySquare, DoorOpen, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, Edit2, X, Trash2 } from 'lucide-react';
import api from '../api/client';
import clsx from 'clsx';

export const RentRoll = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ summary: {}, rentRoll: [] });
    const [buildings, setBuildings] = useState([]);
    const [search, setSearch] = useState('');
    const [buildingFilter, setBuildingFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Inline Edit State
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [updatingRent, setUpdatingRent] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

    // Unit Type presets states
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [unitTypes, setUnitTypes] = useState([]);
    const [newType, setNewType] = useState({ typeName: '', fullUnitRate: '', singleBedroomRate: '' });

    useEffect(() => {
        const fetchRentRoll = async () => {
            try {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : {};
                const role = user.role;
                const endpoint = role === 'OWNER' ? '/api/owner/reports/rent-roll' : '/api/admin/reports/rent-roll';
                const [rentRollRes, propertiesRes] = await Promise.all([
                    api.get(endpoint),
                    api.get(role === 'OWNER' ? '/api/owner/properties' : '/api/admin/properties')
                ]);

                setData(rentRollRes.data);
                setBuildings(propertiesRes.data?.data || propertiesRes.data || []);
            } catch (error) {
                console.error("Error fetching rent roll data", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchUnitTypes = async () => {
            try {
                const res = await api.get('/api/admin/unit-types');
                setUnitTypes(res.data || []);
            } catch (e) {
                console.error(e);
            }
        };

        fetchRentRoll();
        
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        if (user.role !== 'OWNER') fetchUnitTypes();
    }, []);

    const formatDaysRemaining = (endDateStr) => {
        if (!endDateStr) return { text: '-', class: 'bg-slate-50 text-slate-500' };

        const end = new Date(endDateStr);
        const today = new Date();
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: `Expired (${Math.abs(diffDays)}d ago)`, class: 'bg-red-50 text-red-700 border-red-200 border font-semibold' };
        if (diffDays <= 30) return { text: `${diffDays} days`, class: 'bg-red-50 text-red-700 border-red-200 border font-semibold' };
        if (diffDays <= 60) return { text: `${diffDays} days`, class: 'bg-orange-50 text-orange-700 border-orange-200 border font-semibold' };
        if (diffDays <= 90) return { text: `${diffDays} days`, class: 'bg-yellow-50 text-yellow-700 border-yellow-200 border font-semibold' };
        return { text: `${diffDays} days`, class: 'bg-emerald-50 text-emerald-700 border-emerald-200 border font-semibold' };
    };

    const handleExportCSV = () => {
        const headers = ["Building Name", "Lease Type", "Unit Number", "Bedroom Number", "Tenant Name", "Lease Start Date", "Lease End Date", "Days to Expiry", "Monthly Rent", "Potential Rent", "Vacancy Loss", "Outstanding Rent", "Outstanding Deposit", "Status"];
        const rows = filteredRentRoll.map(row => {
            const expiryInfo = formatDaysRemaining(row.endDate);
            return [
                row.buildingName,
                row.leaseType === 'Bedroom Lease' ? 'Bedroom' : row.leaseType,
                row.unitNumber,
                row.bedroomNumber === '-' ? '' : row.bedroomNumber,
                row.tenantName,
                row.startDate ? new Date(row.startDate).toLocaleDateString() : 'N/A',
                row.endDate ? new Date(row.endDate).toLocaleDateString() : 'N/A',
                expiryInfo.text,
                row.monthlyRent || 0,
                row.potentialRent || 0,
                row.vacancyLoss || 0,
                row.outstandingRent || 0,
                row.outstandingDeposit || 0,
                row.status
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rent_Roll_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredRentRoll = (data.rentRoll || []).filter(row => {
        const matchesSearch = row.tenantName.toLowerCase().includes(search.toLowerCase()) ||
            row.unitNumber.toString().toLowerCase().includes(search.toLowerCase()) ||
            row.buildingName.toLowerCase().includes(search.toLowerCase());
        const matchesBuilding = !buildingFilter || row.buildingName === buildings.find(b => b.id.toString() === buildingFilter)?.name;
        const matchesStatus = !statusFilter || row.status === statusFilter;

        return matchesSearch && matchesBuilding && matchesStatus;
    }).sort((a, b) => {
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        const result = new Date(a.endDate) - new Date(b.endDate);
        return sortOrder === 'asc' ? result : -result;
    });

    const handleSavePotentialRent = async (id, type) => {
        if (!editValue || isNaN(parseFloat(editValue))) return setEditingId(null);
        
        try {
            setUpdatingRent(true);
            await api.put('/api/admin/reports/potential-rent', {
                id,
                type,
                potentialRent: parseFloat(editValue)
            });

            // Optimistically update locally
            setData(prev => {
                const updatedRoll = prev.rentRoll.map(row => {
                    if (row.id === id) {
                        return { 
                            ...row, 
                            potentialRent: parseFloat(editValue),
                            monthlyRent: row.status === 'Vacant' ? parseFloat(editValue) : row.monthlyRent,
                            vacancyLoss: row.status === 'Vacant' ? parseFloat(editValue) : row.vacancyLoss
                        };
                    }
                    return row;
                });

                // Re-calculate totals for summary cards
                const totalPotential = updatedRoll.reduce((sum, r) => sum + parseFloat(r.potentialRent || 0), 0);
                const totalVacancy = updatedRoll.reduce((sum, r) => sum + parseFloat(r.vacancyLoss || 0), 0);

                return {
                    ...prev,
                    summary: {
                        ...prev.summary,
                        totalPotentialMonthlyRent: totalPotential,
                        totalVacancyLoss: totalVacancy
                    },
                    rentRoll: updatedRoll
                };
            });
            
            setEditingId(null);
        } catch (e) {
            alert('Failed to update potential rent');
            console.error(e);
        } finally {
            setUpdatingRent(false);
        }
    };

    const toggleSort = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    // Pagination Logic
    const totalPages = Math.ceil(filteredRentRoll.length / itemsPerPage);
    const paginatedData = filteredRentRoll.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isOwnerRole = user.role === 'OWNER' || localStorage.getItem('isOwnerLoggedIn') === 'true';
    const isOwnerPath = window.location.pathname.includes('/owner');
    const Layout = (isOwnerRole || isOwnerPath) ? OwnerLayout : MainLayout;

    return (
        <Layout title="Rent Roll Overview">
            <div className="flex flex-col gap-4 md:gap-6 pb-10">

                {/* SUMMARY KPIS - Exact Client Labels */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 mt-2">
                    {[
                        { label: 'Total Units', value: data.summary.totalUnits, icon: Building, color: 'text-indigo-500' },
                        { label: 'Occupied', value: data.summary.occupiedUnits, icon: KeySquare, color: 'text-emerald-500' },
                        { label: 'Vacant', value: data.summary.vacantUnits, icon: DoorOpen, color: 'text-red-500' },
                        { label: 'Total Actual Monthly Rent', value: `$${(data.summary.totalActualMonthlyRent || 0).toLocaleString()}`, icon: Wallet, color: 'text-indigo-600', isLarge: true },
                        { label: 'Total Potential Monthly Rent', value: `$${(data.summary.totalPotentialMonthlyRent || 0).toLocaleString()}`, icon: Wallet, color: 'text-blue-600', isLarge: true },
                        { label: 'Total Vacancy Loss', value: `$${(data.summary.totalVacancyLoss || 0).toLocaleString()}`, icon: AlertCircle, color: 'text-red-500', isLarge: true },
                        { label: 'Outstanding Rent Balance', value: `$${(data.summary.totalOutstandingRent || 0).toLocaleString()}`, icon: AlertCircle, color: 'text-red-600' },
                        { label: 'Outstanding Deposit Balance', value: `$${(data.summary.totalOutstandingDeposits || 0).toLocaleString()}`, icon: AlertCircle, color: 'text-amber-600' },
                    ].map((kpi, i) => (
                        <div key={i} className={clsx(
                            "bg-white p-2 md:p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-all duration-300 min-h-[100px]",
                            kpi.isLarge ? "bg-indigo-50/30 border-indigo-100 ring-1 ring-indigo-50" : ""
                        )}>
                            <kpi.icon size={16} className={`${kpi.color} mb-1`} />
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-tight w-full px-1 mb-1">{kpi.label}</span>
                            <span className={clsx("font-black text-slate-800", kpi.isLarge ? "text-sm md:text-base" : "text-base md:text-xl")}>{kpi.value || 0}</span>
                        </div>
                    ))}
                </div>

                {/* FILTERS & ACTIONS - Mobile Responsive Stack */}
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <Search size={18} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search tenant or unit..."
                                className="bg-transparent border-none outline-none text-sm w-full text-slate-700"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="sm:w-64 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-indigo-300 transition-all">
                            <Building2 size={18} className="text-slate-400" />
                            <select
                                className="bg-transparent border-none outline-none text-sm text-slate-700 w-full"
                                value={buildingFilter}
                                onChange={(e) => { setBuildingFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Buildings</option>
                                {buildings.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:w-48 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-indigo-300 transition-all">
                            <Filter size={18} className="text-slate-400" />
                            <select
                                className="bg-transparent border-none outline-none text-sm text-slate-700 w-full font-medium"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Statuses</option>
                                <option value="Occupied">Occupied</option>
                                <option value="Vacant">Vacant</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 mr-2">
                            <span className="text-xs text-slate-500 font-medium ml-1">Show</span>
                            <select
                                className="bg-transparent border-none outline-none text-sm text-slate-700 font-bold"
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <Button variant="secondary" onClick={handleExportCSV} className="flex-1 lg:flex-none">
                            <Download size={18} />
                            <span className="hidden sm:inline">Export to Excel</span>
                            <span className="sm:hidden">Export</span>
                        </Button>
                    </div>
                </div>

                {/* TABLE - Horizontal Scroll for Mobile */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <table className="w-full border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-left">
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Building Name</th>
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Unit</th>
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Bed</th>
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant Name</th>
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Start</th>
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">End</th>
                                    <th
                                        className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                        onClick={toggleSort}
                                    >
                                        <div className="flex items-center gap-1">
                                            Expiry
                                            {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        </div>
                                    </th>
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rent</th>
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vacancy Loss</th>
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rent Balance</th>
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deposit Balance</th>
                                    <th className="px-3 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading && (
                                    <tr>
                                        <td colSpan="10" className="px-5 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                                <span className="text-slate-500 font-medium">Loading Rent Roll...</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!loading && paginatedData.length === 0 && (
                                    <tr>
                                        <td colSpan="10" className="px-5 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search size={32} className="text-slate-200 mb-2" />
                                                <span className="text-slate-500 font-medium">No rent roll data found.</span>
                                                <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!loading && paginatedData.map(row => {
                                    const expiryInfo = formatDaysRemaining(row.endDate);
                                    return (
                                         <tr key={row.id} className="hover:bg-slate-50/50 transition-all text-sm group">
                                            <td className="px-3 py-4 font-medium text-slate-800 whitespace-nowrap">{row.buildingName}</td>
                                            <td className="px-3 py-4">
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-tighter",
                                                    row.leaseType === 'Full Unit' ? "bg-slate-100 text-slate-600" : "bg-indigo-50 text-indigo-600"
                                                )}>
                                                    {row.leaseType === 'Bedroom Lease' ? 'Bedroom' : row.leaseType}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 font-bold text-slate-900 text-center">{row.unitNumber}</td>
                                            <td className="px-3 py-4 text-indigo-600 font-black tracking-widest text-center">{row.bedroomNumber === '-' ? '' : row.bedroomNumber}</td>
                                            <td className="px-3 py-4 text-slate-700 font-bold group-hover:text-indigo-600 transition-colors uppercase whitespace-normal min-w-[180px]">{row.tenantName}</td>
                                            <td className="px-3 py-4 text-slate-600 whitespace-nowrap text-xs">
                                                {row.startDate ? new Date(row.startDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-3 py-4 text-slate-600 whitespace-nowrap font-bold text-xs">
                                                {row.endDate ? new Date(row.endDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-3 py-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] inline-block shadow-sm ${expiryInfo.class}`}>
                                                    {expiryInfo.text}
                                                </span>
                                            </td>
                                             <td className="px-3 py-4 font-black text-slate-800">
                                                 <div className="flex flex-col">
                                                     {row.status !== 'Vacant' ? (
                                                         <span>${parseFloat(row.monthlyRent || 0).toLocaleString()}</span>
                                                     ) : (
                                                         <span className="text-slate-600 font-bold">${parseFloat(row.potentialRent || 0).toLocaleString()}</span>
                                                     )}
                                                     {row.status === 'Vacant' && (
                                                         <span className="text-[9px] text-slate-400 font-bold tracking-tight uppercase mt-0.5">Potential Rent</span>
                                                     )}
                                                 </div>
                                             </td>
                                             <td className="px-3 py-4 font-bold text-red-500">
                                                ${parseFloat(row.vacancyLoss || 0).toLocaleString()}
                                             </td>
                                             <td className="px-3 py-4 font-bold text-slate-700">
                                                ${parseFloat(row.outstandingRent || 0).toLocaleString()}
                                             </td>
                                             <td className="px-3 py-4 font-bold text-amber-600">
                                                ${parseFloat(row.outstandingDeposit || 0).toLocaleString()}
                                             </td>
                                            <td className="px-3 py-4">
                                                <span className={clsx(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                                                    row.status === 'Occupied'
                                                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                                        : 'bg-white text-slate-400 border-slate-200'
                                                )}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION FOOTER */}
                    {!loading && totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredRentRoll.length)} of {filteredRentRoll.length}
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <div className="flex items-center gap-1 mx-2">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1;
                                        // Simple logic to show current, first, last, and a few around current
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={clsx(
                                                        "w-8 h-8 text-xs font-black rounded-lg transition-all",
                                                        currentPage === pageNum
                                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110"
                                                            : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
                                                    )}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (
                                            (pageNum === 2 && currentPage > 3) ||
                                            (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                        ) {
                                            return <span key={pageNum} className="px-1 text-slate-300">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};
