import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/Card';
import api from '../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { 
  Building2, 
  Home, 
  Users, 
  TrendingUp, 
  Wallet, 
  BadgeDollarSign, 
  ShieldAlert, 
  FileText, 
  Car, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

import { OwnerSelector } from '../components/OwnerSelector';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');

  const fetchStats = async (ownerId = '') => {
    try {
      setLoading(true);
      const ownerParam = ownerId ? `?ownerId=${ownerId}` : '';
      const [dashRes, revRes] = await Promise.all([
        api.get(`/api/admin/dashboard/stats${ownerParam}`),
        api.get(`/api/admin/analytics/revenue${ownerParam}`)
      ]);
      setStats(dashRes.data);
      setRevenueStats(revRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      setStats(null);
      setRevenueStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedOwnerId);
  }, [selectedOwnerId]);

  const handleCancelRefund = async (tenantId, unitId) => {
    if (!window.confirm('Are you sure you want to cancel the refund process for this tenant?')) return;
    try {
      await api.post('/api/admin/refunds', {
        tenantId: parseInt(tenantId),
        unitId: parseInt(unitId),
        type: 'Security Deposit',
        status: 'Cancelled',
        outcomeReason: 'Cancelled – lease renewed',
        amount: 0,
        reason: 'Refund process cancelled via Dashboard Alert'
      });
      alert('Refund process cancelled successfully.');
      fetchStats(selectedOwnerId);
    } catch (error) {
      console.error('Failed to cancel refund process', error);
      alert('Failed to cancel refund process');
    }
  };

  // Fallback to initial structure if API fails or returns partial
  const data = stats || {
    totalProperties: 0,
    totalUnits: 0,
    occupancy: { occupied: 0, vacant: 0 },
    projectedRevenue: 0,
    actualRevenue: 0,
    insuranceAlerts: { expired: 0, expiringSoon: 0 },
    leaseAlerts: { expired: 0, expiringSoon: 0 },
    leaseAlertList: [],
    recentActivity: []
  };

  const { totalProperties, totalUnits, occupancy, projectedRevenue, actualRevenue, outstandingRent, outstandingDeposits, insuranceAlerts, leaseAlerts, leaseAlertList, recentActivity, vehicleStats, pendingRefunds } = data;

  const sortedLeaseAlertList = leaseAlertList ? [...leaseAlertList].sort((a, b) => a.daysLeft - b.daysLeft) : [];

  // Build revenue chart from real monthly data (sorted chronologically)
  const revenueData = [...(revenueStats?.monthlyRevenue || [])]
    .sort((a, b) => {
      const parse = (s) => {
        if (!s) return 0;
        if (typeof s !== 'string') return 0;
        if (s.includes('-')) {
          const [y, m] = s.split('-');
          return new Date(y, parseInt(m, 10) - 1).getTime();
        }
        const [mName, y] = s.split(' ');
        const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        const shortMonthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

        let mIdx = monthNames.indexOf(mName.toLowerCase());
        if (mIdx === -1) mIdx = shortMonthNames.indexOf(mName.toLowerCase());

        return new Date(y, mIdx !== -1 ? mIdx : 0).getTime();
      };
      return parse(a.month) - parse(b.month);
    })
    .map(m => ({
      month: m.month,          // e.g. "2025-03"
      revenue: m.amount,
      rent: m.rent,
      deposit: m.deposit,
      serviceFees: m.serviceFees,
    }));

  // Format month label: "2025-03" -> "Mar '25" or "March 2026" -> "Mar '26"
  const formatMonth = (val) => {
    if (!val) return '';
    if (val.toString().includes('-')) {
      const [year, mon] = val.split('-');
      const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${names[parseInt(mon, 10) - 1]} '${year.slice(2)}`;
    }
    // Handle "March 2025" format
    const parts = val.toString().split(' ');
    if (parts.length === 2) {
      const longMonth = parts[0];
      const year = parts[1];
      return `${longMonth.substring(0, 3)} '${year.slice(2)}`;
    }
    return val;
  };

  return (
    <MainLayout title="Dashboard Overview">
      <div className="flex flex-col gap-8">

        {/* TOP BAR / FILTERS */}
        <section className="flex justify-end sticky top-0 z-10 py-2 bg-slate-50/80 backdrop-blur-sm -mx-4 px-4">
          <OwnerSelector value={selectedOwnerId} onOwnerChange={(id) => setSelectedOwnerId(id)} />
        </section>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* TOP SUMMARY CARDS */}
            <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
              <Card className="rounded-[18px] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:rotate-1 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Building2 size={48} />
                </div>
                <span className="text-sm text-gray-500 tracking-wide font-medium flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-500" />
                  Total Properties
                </span>
                <h2 className="text-[2rem] font-black mt-2 leading-tight text-slate-800">{totalProperties}</h2>
              </Card>

              <Card className="rounded-[18px] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:rotate-1 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Home size={48} />
                </div>
                <span className="text-sm text-gray-500 tracking-wide font-medium flex items-center gap-2">
                  <Home size={16} className="text-indigo-500" />
                  Total Units
                </span>
                <h2 className="text-[2rem] font-black mt-2 leading-tight text-slate-800">{totalUnits}</h2>
              </Card>

              <Card className="rounded-[18px] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:rotate-1 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users size={48} />
                </div>
                <span className="text-sm text-gray-500 tracking-wide font-medium flex items-center gap-2">
                  <Users size={16} className="text-indigo-500" />
                  Occupancy
                </span>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">OCCUPIED</span>
                    <span className="text-lg font-black text-indigo-600">{occupancy.occupied}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">VACANT</span>
                    <span className="text-lg font-black text-rose-500">{occupancy.vacant}</span>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[18px] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:rotate-1 border-l-[6px] border-indigo-500 group relative">
                <span className="text-sm text-gray-500 tracking-wide font-medium flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-500" />
                  Projected Revenue
                </span>
                <h2 className="text-[1.75rem] font-black mt-2 leading-tight truncate text-slate-800" title={`$${(projectedRevenue || 0).toLocaleString('en-CA')}`}>
                  ${(projectedRevenue || 0).toLocaleString('en-CA')}
                </h2>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-tighter">Expected</span>
                  <p className="text-[10px] text-gray-400 font-medium">Monthly Active</p>
                </div>
              </Card>

              <Card className="rounded-[18px] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:rotate-1 border-l-[6px] border-emerald-500 group relative">
                <span className="text-sm text-gray-500 tracking-wide font-medium flex items-center gap-2">
                  <Wallet size={16} className="text-emerald-500" />
                  Actual Revenue
                </span>
                <h2 className="text-[1.75rem] font-black mt-2 leading-tight truncate text-slate-800" title={`$${(actualRevenue || 0).toLocaleString('en-CA')}`}>
                  ${(actualRevenue || 0).toLocaleString('en-CA')}
                </h2>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tighter">Received</span>
                  <p className="text-[10px] text-gray-400 font-medium">Year to Date</p>
                </div>
              </Card>

              <Card className="rounded-[18px] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:rotate-1 border-l-[6px] border-amber-500 group">
                <span className="text-sm text-gray-500 tracking-wide font-black uppercase italic flex items-center gap-2">
                  <BadgeDollarSign size={16} className="text-amber-500" />
                  Outstanding Rent
                </span>
                <h2 className="text-[1.75rem] font-black mt-2 leading-tight truncate text-slate-800" title={`$${(outstandingRent || 0).toLocaleString('en-CA')}`}>
                  ${(outstandingRent || 0).toLocaleString('en-CA')}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <ArrowDownRight size={14} className="text-amber-500" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Unpaid Lease Invoices</p>
                </div>
              </Card>

              <Card className="rounded-[18px] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:rotate-1 border-l-[6px] border-orange-400 group">
                <span className="text-sm text-gray-500 tracking-wide font-black uppercase italic flex items-center gap-2">
                  <BadgeDollarSign size={16} className="text-orange-400" />
                  Outstanding Deposits
                </span>
                <h2 className="text-[1.75rem] font-black mt-2 leading-tight truncate text-slate-800" title={`$${(outstandingDeposits || 0).toLocaleString('en-CA')}`}>
                  ${(outstandingDeposits || 0).toLocaleString('en-CA')}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                   <Clock size={14} className="text-orange-400" />
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Pending Security Payments</p>
                </div>
              </Card>

              <Card
                className="rounded-[18px] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:rotate-1 border-l-[6px] border-red-500 cursor-pointer group"
                onClick={() => window.location.href = '/insurance-alerts'}
              >
                <span className="text-sm text-gray-500 tracking-wide font-black uppercase italic flex items-center gap-2">
                  <ShieldAlert size={16} className="text-red-500" />
                  Insurance Alerts
                </span>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-tight">Expired</span>
                    <span className="text-lg font-black text-red-700">{insuranceAlerts.expired}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-tight">Expiring Soon</span>
                    <span className="text-lg font-black text-amber-700">{insuranceAlerts.expiringSoon}</span>
                  </div>
                </div>
              </Card>

              <Card
                className="rounded-[18px] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:rotate-1 border-l-[6px] border-orange-500 cursor-pointer group"
                onClick={() => window.location.href = '/leases'}
              >
                <span className="text-sm text-gray-500 tracking-wide font-black uppercase italic flex items-center gap-2">
                  <FileText size={16} className="text-orange-500" />
                  Lease Alerts
                </span>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-tight">Expired</span>
                    <span className="text-lg font-black text-orange-700">{leaseAlerts?.expired || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-yellow-600 uppercase tracking-tight">Expiring Soon</span>
                    <span className="text-lg font-black text-yellow-700">{leaseAlerts?.expiringSoon || 0}</span>
                  </div>
                </div>
              </Card>

              <Card
                className="rounded-[18px] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:rotate-1 border-l-[6px] border-rose-600 cursor-pointer group"
                onClick={() => window.location.href = '/tenants/vehicles?filter=unauthorized'}
              >
                <span className="text-sm text-gray-500 tracking-wide font-black uppercase italic flex items-center gap-2">
                  <Car size={16} className="text-rose-600" />
                  Parking Alerts
                </span>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-tight">Unauthorized</span>
                    <span className="text-2xl font-black text-rose-700">{vehicleStats?.unauthorized || 0}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Registered</span>
                    <span className="text-sm font-black text-slate-500">{vehicleStats?.total || 0}</span>
                  </div>
                </div>
              </Card>
            </section>

            {/* LEASE EXPIRATION ALERTS TABLE (Detailed List) */}
            <section className="mt-8 mb-6">
              <Card className="p-8 rounded-[24px] bg-white shadow-[0_22px_50px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tight">Lease Expiration Alerts</h3>
                    <p className="text-sm text-gray-400 font-medium mt-1">Clients criteria: 45 days for short-term, 4 months for long-term leases</p>
                  </div>
                  <div className="px-4 py-2 bg-orange-50 rounded-full border border-orange-100">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
                      {leaseAlertList?.length || 0} Alerts Found
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Lease Holder</th>
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Unit / Building</th>
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Expiry Date</th>
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Remaining</th>
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sortedLeaseAlertList?.map((alert) => (
                        <tr key={alert.id} className="group transition-colors hover:bg-gray-50/50">
                          <td className="py-5 pl-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-800">{alert.tenant}</span>
                              <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">{alert.type}</span>
                            </div>
                          </td>
                          <td className="py-5">
                            <span className="text-sm font-semibold text-gray-600">{alert.unit}</span>
                          </td>
                          <td className="py-5 text-center">
                            <span className="text-sm font-medium text-gray-500">
                              {new Date(alert.expiryDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </td>
                          <td className="py-5 text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${alert.status === 'Expired'
                              ? 'bg-red-50 text-red-600'
                              : alert.daysLeft <= 30 ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-600'
                              }`}>
                              {alert.status === 'Expired' ? 'PAST DUE' : `${alert.daysLeft} Days Left`}
                            </span>
                          </td>
                          <td className="py-5 text-right pr-2">
                            <button
                              onClick={() => window.location.href = `/leases`}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline uppercase tracking-widest transition-colors"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!leaseAlertList || leaseAlertList.length === 0) && (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-gray-400 italic text-sm font-medium">
                            No urgent lease expirations based on current criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            {/* DEPOSITS PENDING REFUND TABLE */}
            <section className="mt-8 mb-6">
              <Card className="p-8 rounded-[24px] bg-white shadow-[0_22px_50px_rgba(0,0,0,0.08)] border-t-[4px] border-amber-500 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                       <Clock size={20} className="text-amber-500 animate-pulse" /> Deposits Pending Refund
                    </h3>
                    <p className="text-sm text-gray-400 font-medium mt-1">Tenant left, leases expired with previously paid security balances.</p>
                  </div>
                  <div className="px-4 py-2 bg-amber-50 rounded-full border border-amber-100">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                      {pendingRefunds?.length || 0} Awaiting Action
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Tenant</th>
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Property / Unit</th>
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Paid Deposit</th>
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Move Out Date</th>
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Refund Status</th>
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pendingRefunds?.map((item) => (
                        <tr key={item.id} className="group transition-colors hover:bg-gray-50/50">
                          <td className="py-5 pl-2">
                            <span className="text-sm font-bold text-gray-800">{item.tenantName}</span>
                          </td>
                          <td className="py-5">
                            <span className="text-sm font-semibold text-gray-600">{item.building} / {item.unitNumber}</span>
                          </td>
                          <td className="py-5 text-center">
                            <span className="text-sm font-black text-emerald-600 font-mono">
                              $ {parseFloat(item.depositAmount).toLocaleString('en-CA')}
                            </span>
                          </td>
                          <td className="py-5 text-center">
                            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-bold">
                              {item.leaseExpiryDate ? new Date(item.leaseExpiryDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                            </span>
                          </td>
                          <td className="py-5 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-tight border border-orange-100">
                              Pending
                            </span>
                          </td>
                          <td className="py-5 text-right pr-2 flex items-center justify-end gap-2">
                            <button
                              onClick={() => window.location.href = `/payments/refunds?tenantId=${item.tenantId}&unitId=${item.unitId}`}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 shadow-sm shadow-amber-200 uppercase tracking-widest transition-all"
                            >
                              Refund
                            </button>
                            <button
                              onClick={() => handleCancelRefund(item.tenantId, item.unitId)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest transition-all"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!pendingRefunds || pendingRefunds.length === 0) && (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-gray-400 italic text-sm font-medium">
                            <FileText size={24} className="mx-auto mb-2 text-slate-300" />
                            No outstanding deposits waiting to be refunded!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            {/* LOWER CONTENT */}
            <section className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-6">
              <Card title="Recent Activity" className="p-6 rounded-[20px] bg-white shadow-[0_18px_35px_rgba(0,0,0,0.07)]">
                <ul className="pl-4 text-gray-700 space-y-2 list-disc marker:text-gray-400">
                  {recentActivity.map((activity, index) => (
                    <li key={index}>{activity}</li>
                  ))}
                  {recentActivity.length === 0 && <li className="list-none text-gray-400 italic">No recent activity found</li>}
                </ul>
              </Card>

              <Card title="Revenue Trends (Monthly)" className="p-6 rounded-[20px] bg-white shadow-[0_18px_35px_rgba(0,0,0,0.07)]">
                {revenueData.length === 0 ? (
                  <p className="text-gray-400 italic text-sm mt-2">No revenue data available yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={revenueData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatMonth}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f1f5f9' }}
                        formatter={(value) => [`$${parseFloat(value).toLocaleString('en-CA')}`, 'Revenue']}
                        labelFormatter={formatMonth}
                      />
                      <Bar
                        dataKey="revenue"
                        radius={[6, 6, 0, 0]}
                        fill="#6366f1"
                        barSize={32}
                      >
                        <LabelList
                          dataKey="revenue"
                          position="top"
                          style={{ fontSize: '10px', fill: '#64748b', fontWeight: '600' }}
                          formatter={(v) => `$${parseFloat(v) >= 1000 ? (parseFloat(v) / 1000).toFixed(1) + 'k' : parseFloat(v).toFixed(0)}`}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </section>
          </>
        )}

      </div>
    </MainLayout>
  );
};
