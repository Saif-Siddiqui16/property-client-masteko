import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/client';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // Ensure form submission doesn't reload
    try {
      setError('');
      setLoading(true);
      const res = await api.post('/api/auth/login', { email, password });

      const { accessToken, refreshToken, user } = res.data;

      // Common storage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Role-based logic
      if (user.role === 'ADMIN' || user.role === 'COWORKER') {
        localStorage.setItem('isLoggedIn', 'true');
        if (user.role === 'COWORKER') {
          try {
            const permRes = await api.get(`/api/admin/coworkers/${user.id}/permissions`);
            localStorage.setItem('permissions', JSON.stringify(permRes.data));
          } catch (e) { console.error('Error fetching coworker permissions:', e); }
        }
        navigate('/dashboard');
      }
      else if (user.role === 'TENANT') {
        localStorage.setItem('tenantLoggedIn', 'true');
        localStorage.setItem('currentTenantId', user.id);
        navigate('/tenant/dashboard');
      }
      else if (user.role === 'OWNER') {
        localStorage.setItem('isOwnerLoggedIn', 'true');
        localStorage.setItem('ownerId', user.id);
        navigate('/owner/dashboard');
      }
      else {
        setError('Unknown user role');
        localStorage.clear();
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@property.com');
      setPassword('123456');
    } else if (role === 'tenant') {
      setEmail('tenant@example.com'); // You might need to adjust this to a real tenant email
      setPassword('123456');
    } else if (role === 'owner') {
      setEmail('owner@property.com'); // You might need to adjust this to a real owner email
      setPassword('123456');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* LEFT IMAGE */}
      <div className="hidden md:flex flex-1 relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560185008-b033106af5c3')" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/75 to-blue-800/85 p-[60px] flex flex-col justify-center text-white">
          <h1 className="text-[42px] font-bold mb-3">ProPerty</h1>
          <p className="text-lg opacity-95">Smart Property & Rental Management</p>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="w-full md:w-[420px] bg-white p-12 flex flex-col justify-center shadow-xl md:shadow-none">
        <h2 className="text-[28px] font-semibold mb-1.5 text-slate-900">Welcome Back</h2>
        <p className="text-sm text-slate-500 mb-8">Sign in to access your dashboard</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="flex flex-col mb-5">
            <label className="text-[13px] mb-1.5 text-slate-700">Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[42px] px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15 transition-all w-full"
            />
          </div>

          <div className="flex flex-col mb-5">
            <label className="text-[13px] mb-1.5 text-slate-700">Password</label>
            <input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[42px] px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15 transition-all w-full"
            />
          </div>

          <button
            type="submit"
            className="w-full h-[44px] bg-blue-600 text-white border-0 rounded-md text-[15px] cursor-pointer mt-2.5 hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-7 bg-slate-100 p-3.5 rounded-md text-[13px] text-slate-600">
          <strong className="block mb-2 text-slate-900">Demo Credentials</strong>
          <p className="mb-2 text-[12px] text-slate-500">All use password: <strong>123456</strong></p>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => autofillDemo('admin')} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 text-slate-700">Admin</button>
            <button type="button" onClick={() => autofillDemo('owner')} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 text-slate-700">Owner</button>
            <button type="button" onClick={() => autofillDemo('tenant')} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 text-slate-700">Tenant</button>
          </div>

        </div>
      </div>
    </div>
  );
};


